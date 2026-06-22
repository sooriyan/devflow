import { exec } from 'child_process'
import { Octokit } from '@octokit/rest'

export interface ExecutionContext {
  nodeOutputs: Record<string, any>
  credentials: Record<string, any>
  log: (nodeId: string, message: string, type?: 'info' | 'error' | 'success' | 'warn') => void
  onCancel: (callback: () => void) => () => void
}

// Simple variable resolver: replaces {{ nodeName.field }} or {{ globals.field }}
export function resolveVariables(text: string, context: ExecutionContext): string {
  if (typeof text !== 'string') return text

  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expression) => {
    const parts = expression.trim().split('.')
    const source = parts[0] // e.g., "TerminalNode" or "globals"

    if (source === 'globals') {
      const key = parts[1]
      return context.credentials[key] || ''
    }

    // Lookup in nodeOutputs
    // The format could be: {{ TerminalNode.stdout }} or {{ TerminalNode.data.something }}
    const output = context.nodeOutputs[source]
    if (!output) {
      return ''
    }

    let current = output
    for (let i = 1; i < parts.length; i++) {
      if (current && typeof current === 'object') {
        current = current[parts[i]]
      } else {
        return ''
      }
    }

    if (typeof current === 'object') {
      return JSON.stringify(current)
    }

    return current !== undefined ? String(current) : ''
  })
}

export const nodeExecutors: Record<string, (node: any, context: ExecutionContext) => Promise<any>> = {
  // 1. Manual / Trigger nodes
  trigger: async (node, context) => {
    context.log(node.id, 'Workflow triggered manually', 'success')
    return { triggered: true, timestamp: new Date().toISOString() }
  },

  // 2. Terminal Node
  terminal: async (node, context) => {
    const rawCommand = node.data.command || ''
    const cwd = resolveVariables(node.data.cwd || '', context) || process.cwd()
    const shellType = node.data.shellType || 'default'
    const showLogs = node.data.showLogs === true
    
    let shell: string | undefined = undefined
    if (shellType === 'default') {
      shell = process.platform === 'win32' ? undefined : (process.env.SHELL || '/bin/zsh')
    } else if (shellType === 'bash') {
      shell = 'bash'
    } else if (shellType === 'zsh') {
      shell = 'zsh'
    } else if (shellType === 'powershell') {
      shell = 'powershell'
    } else if (shellType === 'cmd') {
      shell = 'cmd.exe'
    } else if (shellType === 'custom' && node.data.customShell) {
      shell = resolveVariables(node.data.customShell, context)
    }

    const resolvedCommand = resolveVariables(rawCommand, context)

    if (!resolvedCommand.trim()) {
      context.log(node.id, `No commands to execute`, 'warn')
      return { stdout: '', stderr: '', exitCode: 0 }
    }

    let commandToRun = resolvedCommand
    if (process.platform !== 'win32') {
      const nvmSource = `
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
  . "/usr/local/opt/nvm/nvm.sh"
elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  . "/opt/homebrew/opt/nvm/nvm.sh"
fi
`
      commandToRun = nvmSource + '\n' + resolvedCommand
    }

    let activeProcess: any = null
    let wasCancelled = false

    const unsubscribe = context.onCancel(() => {
      wasCancelled = true
      if (activeProcess) {
        context.log(node.id, `Killing terminal command process`, 'warn')
        activeProcess.kill()
      }
    })

    let accumulatedStdout = ''
    let accumulatedStderr = ''
    let stdoutBuffer = ''
    let stderrBuffer = ''

    const shellDisplay = shell ? ` (shell: ${shell})` : ''
    context.log(node.id, `Executing terminal commands${shellDisplay} in ${cwd}`, 'info')

    try {
      if (wasCancelled) {
        throw new Error('Terminal execution cancelled by user')
      }

      const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
        const proc = exec(commandToRun, { cwd, shell }, (error, stdout, stderr) => {
          activeProcess = null
          
          // Log any remaining buffered text
          if (showLogs) {
            if (stdoutBuffer.trim()) {
              context.log(node.id, stdoutBuffer.trimEnd(), 'info')
            }
            if (stderrBuffer.trim()) {
              context.log(node.id, stderrBuffer.trimEnd(), 'warn')
            }
          }

          if (error) {
            if (wasCancelled) {
              reject(new Error('Terminal execution cancelled by user'))
            } else {
              context.log(node.id, `Command failed: ${error.message}`, 'error')
              const errObj = new Error(error.message) as any
              errObj.stdout = accumulatedStdout
              errObj.stderr = accumulatedStderr
              errObj.exitCode = error.code || 1
              reject(errObj)
            }
          } else {
            resolve({ stdout: accumulatedStdout, stderr: accumulatedStderr, exitCode: 0 })
          }
        })

        proc.stdout?.on('data', (data) => {
          const str = data.toString()
          
          // Cap accumulated buffer to 10MB to avoid Main Process OOM
          if (accumulatedStdout.length < 10 * 1024 * 1024) {
            accumulatedStdout += str
          } else if (!accumulatedStdout.endsWith('\n[Output truncated due to size limit]')) {
            accumulatedStdout += '\n[Output truncated due to size limit]'
          }

          if (showLogs) {
            stdoutBuffer += str
            const lines = stdoutBuffer.split('\n')
            for (let i = 0; i < lines.length - 1; i++) {
              context.log(node.id, lines[i].trimEnd(), 'info')
            }
            stdoutBuffer = lines[lines.length - 1]
          }
        })

        proc.stderr?.on('data', (data) => {
          const str = data.toString()

          // Cap accumulated buffer to 10MB to avoid Main Process OOM
          if (accumulatedStderr.length < 10 * 1024 * 1024) {
            accumulatedStderr += str
          } else if (!accumulatedStderr.endsWith('\n[Output truncated due to size limit]')) {
            accumulatedStderr += '\n[Output truncated due to size limit]'
          }

          if (showLogs) {
            stderrBuffer += str
            const lines = stderrBuffer.split('\n')
            for (let i = 0; i < lines.length - 1; i++) {
              context.log(node.id, lines[i].trimEnd(), 'warn')
            }
            stderrBuffer = lines[lines.length - 1]
          }
        })

        activeProcess = proc
      })

      context.log(node.id, `All commands completed successfully`, 'success')
      return {
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim(),
        exitCode: 0
      }
    } finally {
      unsubscribe()
    }
  },

  // 3. Git Node
  git: async (node, context) => {
    const operation = node.data.operation // 'branch', 'commit', 'cherry-pick', 'push'
    const cwd = resolveVariables(node.data.cwd || '', context) || process.cwd()
    
    const runGitCommand = (cmd: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        exec(cmd, { cwd }, (error, stdout, stderr) => {
          if (error) reject(new Error(stderr || error.message))
          else resolve(stdout.trim())
        })
      })
    }

    context.log(node.id, `Starting Git Operation: ${operation}`, 'info')

    try {
      if (operation === 'branch') {
        const branchName = resolveVariables(node.data.branchName || '', context)
        if (!branchName) throw new Error('Branch name is required')
        
        context.log(node.id, `Creating and switching to branch: ${branchName}`, 'info')
        // Check if branch exists, otherwise create it
        try {
          await runGitCommand(`git checkout ${branchName}`)
          context.log(node.id, `Switched to existing branch: ${branchName}`, 'success')
        } catch {
          const result = await runGitCommand(`git checkout -b ${branchName}`)
          context.log(node.id, `Created and switched to branch: ${branchName}`, 'success')
        }
        return { branchName, success: true }
      } 
      
      else if (operation === 'commit') {
        const message = resolveVariables(node.data.commitMessage || '', context) || 'Commit from DevFlow'
        context.log(node.id, `Staging files and committing with message: "${message}"`, 'info')
        await runGitCommand('git add .')
        const result = await runGitCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`)
        context.log(node.id, `Committed successfully: ${result}`, 'success')
        return { commitResult: result, success: true }
      } 
      
      else if (operation === 'cherry-pick') {
        const commitHash = resolveVariables(node.data.commitHash || '', context)
        if (!commitHash) throw new Error('Commit hash is required')
        context.log(node.id, `Cherry picking commit: ${commitHash}`, 'info')
        const result = await runGitCommand(`git cherry-pick ${commitHash}`)
        context.log(node.id, `Cherry pick successful`, 'success')
        return { cherryPickResult: result, success: true }
      } 
      
      else if (operation === 'push') {
        const remote = resolveVariables(node.data.remote || '', context) || 'origin'
        const branch = resolveVariables(node.data.branchName || '', context)
        if (!branch) throw new Error('Branch name is required to push')
        context.log(node.id, `Pushing branch ${branch} to ${remote}`, 'info')
        const result = await runGitCommand(`git push ${remote} ${branch}`)
        context.log(node.id, `Push completed`, 'success')
        return { pushResult: result, success: true }
      }

      throw new Error(`Unsupported Git operation: ${operation}`)
    } catch (err: any) {
      context.log(node.id, `Git operation failed: ${err.message}`, 'error')
      throw err
    }
  },

  // 4. GitHub Node
  github: async (node, context) => {
    const operation = node.data.operation // 'create-pr', 'pr-comment'
    const githubToken = context.credentials.githubToken
    
    if (!githubToken) {
      throw new Error('GitHub Personal Access Token (githubToken) is missing in credentials settings.')
    }

    const octokit = new Octokit({ auth: githubToken })
    const owner = resolveVariables(node.data.owner || '', context)
    const repo = resolveVariables(node.data.repo || '', context)

    context.log(node.id, `Starting GitHub Operation: ${operation} on ${owner}/${repo}`, 'info')

    try {
      if (operation === 'create-pr') {
        const title = resolveVariables(node.data.prTitle || '', context)
        const head = resolveVariables(node.data.headBranch || '', context)
        const base = resolveVariables(node.data.baseBranch || '', context) || 'main'
        const body = resolveVariables(node.data.prBody || '', context) || 'Automated PR by DevFlow'

        context.log(node.id, `Creating PR from ${head} to ${base}...`, 'info')
        const response = await octokit.pulls.create({
          owner,
          repo,
          title,
          head,
          base,
          body,
          draft: true
        })

        context.log(node.id, `PR created successfully: ${response.data.html_url}`, 'success')
        return { 
          prNumber: response.data.number, 
          prUrl: response.data.html_url, 
          success: true 
        }
      } 
      
      else if (operation === 'pr-comment') {
        const prNumberStr = resolveVariables(node.data.prNumber || '', context)
        const prNumber = parseInt(prNumberStr, 10)
        const body = resolveVariables(node.data.commentBody || '', context)

        if (isNaN(prNumber)) throw new Error('Valid PR number is required')
        if (!body) throw new Error('Comment body is required')

        context.log(node.id, `Adding comment to PR #${prNumber}...`, 'info')
        const response = await octokit.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body
        })

        context.log(node.id, `Comment added: ${response.data.html_url}`, 'success')
        return { commentUrl: response.data.html_url, success: true }
      }

      throw new Error(`Unsupported GitHub operation: ${operation}`)
    } catch (err: any) {
      context.log(node.id, `GitHub operation failed: ${err.message}`, 'error')
      throw err
    }
  },

  // 5. Jira Node
  jira: async (node, context) => {
    const operation = node.data.operation // 'comment', 'transition'
    const jiraHost = context.credentials.jiraHost // e.g. "your-domain.atlassian.net"
    const jiraEmail = context.credentials.jiraEmail
    const jiraToken = context.credentials.jiraToken

    if (!jiraHost || !jiraEmail || !jiraToken) {
      throw new Error('Jira credentials (jiraHost, jiraEmail, jiraToken) are incomplete in settings.')
    }

    const issueKey = resolveVariables(node.data.issueKey || '', context)
    if (!issueKey) throw new Error('Jira Issue Key (e.g. PROJ-123) is required')

    const authHeader = `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`
    const baseUrl = `https://${jiraHost.replace(/^https?:\/\//, '')}/rest/api/3`

    context.log(node.id, `Starting Jira Operation: ${operation} for ${issueKey}`, 'info')

    try {
      if (operation === 'comment') {
        const commentText = resolveVariables(node.data.comment || '', context)
        if (!commentText) throw new Error('Comment text is required')

        context.log(node.id, `Adding comment to Jira ticket ${issueKey}...`, 'info')
        // Atlassian Document Format (ADF) required for v3 API
        const commentBody = {
          body: {
            version: 1,
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: commentText }]
              }
            ]
          }
        }

        const res = await fetch(`${baseUrl}/issue/${issueKey}/comment`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(commentBody)
        })

        if (!res.ok) {
          const errMsg = await res.text()
          throw new Error(`Jira API error ${res.status}: ${errMsg}`)
        }

        const data = (await res.json()) as any
        context.log(node.id, `Jira comment added successfully`, 'success')
        return { commentId: data.id, success: true }
      } 
      
      else if (operation === 'transition') {
        const transitionName = resolveVariables(node.data.transitionName || '', context)
        if (!transitionName) throw new Error('Transition target is required')

        // Get transitions first to find the ID corresponding to transitionName
        context.log(node.id, `Fetching transitions for ${issueKey}...`, 'info')
        const getRes = await fetch(`${baseUrl}/issue/${issueKey}/transitions`, {
          headers: { 'Authorization': authHeader }
        })
        if (!getRes.ok) throw new Error(`Failed to fetch transitions: ${getRes.statusText}`)
        
        const transData = (await getRes.json()) as any
        const foundTransition = transData.transitions.find(
          (t: any) => t.name.toLowerCase() === transitionName.toLowerCase() || t.id === transitionName
        )

        if (!foundTransition) {
          throw new Error(`Jira transition "${transitionName}" not found on issue ${issueKey}. Available: ${transData.transitions.map((t: any) => t.name).join(', ')}`)
        }

        context.log(node.id, `Executing transition to status: ${foundTransition.name} (ID: ${foundTransition.id})`, 'info')
        const postRes = await fetch(`${baseUrl}/issue/${issueKey}/transitions`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ transition: { id: foundTransition.id } })
        })

        if (!postRes.ok) {
          const errMsg = await postRes.text()
          throw new Error(`Failed to apply transition: ${errMsg}`)
        }

        context.log(node.id, `Jira issue transitioned successfully to "${foundTransition.name}"`, 'success')
        return { transitionedTo: foundTransition.name, success: true }
      }

      throw new Error(`Unsupported Jira operation: ${operation}`)
    } catch (err: any) {
      context.log(node.id, `Jira operation failed: ${err.message}`, 'error')
      throw err
    }
  },

  // 6. MCP Node (Model Context Protocol stdio client)
  mcp: async (node, context) => {
    const serverCmd = resolveVariables(node.data.serverCmd || '', context)
    const serverArgsStr = resolveVariables(node.data.serverArgs || '', context)
    const toolName = resolveVariables(node.data.toolName || '', context)
    const toolArgsStr = resolveVariables(node.data.toolArgs || '', context) || '{}'

    if (!serverCmd) throw new Error('MCP server command (e.g. npx) is required')
    if (!toolName) throw new Error('MCP Tool Name is required')

    const serverArgs = serverArgsStr ? serverArgsStr.split(' ').filter(Boolean) : []
    const toolArgs = JSON.parse(toolArgsStr)

    context.log(node.id, `Starting MCP Connection to Server: "${serverCmd} ${serverArgs.join(' ')}"`, 'info')
    context.log(node.id, `Calling tool: "${toolName}" with args: ${JSON.stringify(toolArgs)}`, 'info')

    let activeProcess: any = null
    let wasCancelled = false

    const unsubscribe = context.onCancel(() => {
      wasCancelled = true
      if (activeProcess) {
        context.log(node.id, `Killing MCP process`, 'warn')
        activeProcess.kill()
      }
    })

    try {
      return await new Promise((resolve, reject) => {
        const mcpProcess = exec(`${serverCmd} ${serverArgs.join(' ')}`)
        activeProcess = mcpProcess
        
        let stdoutBuffer = ''
        let resolved = false

        mcpProcess.stdout?.on('data', (data) => {
          stdoutBuffer += data
          // Try parsing JSON-RPC messages
          const lines = stdoutBuffer.split('\n')
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim()
            if (!line) continue
            try {
              const parsed = JSON.parse(line)
              if (parsed.id === 1 && (parsed.result || parsed.error)) {
                resolved = true
                mcpProcess.kill()
                if (parsed.error) {
                  context.log(node.id, `MCP Tool execution failed: ${parsed.error.message}`, 'error')
                  reject(new Error(parsed.error.message))
                } else {
                  context.log(node.id, `MCP Tool execution succeeded`, 'success')
                  resolve(parsed.result)
                }
                break
              }
            } catch {
              // Ignore incomplete chunks or non-json lines (stderr/debug lines)
            }
          }
          stdoutBuffer = lines[lines.length - 1]
        })

        mcpProcess.stderr?.on('data', (data) => {
          context.log(node.id, `[MCP Server Log] ${data}`, 'warn')
        })

        mcpProcess.on('close', (code) => {
          activeProcess = null
          if (wasCancelled) {
            reject(new Error(`MCP execution cancelled by user`))
          } else if (!resolved) {
            reject(new Error(`MCP server closed prematurely with code ${code}`))
          }
        })

        // Send JSON-RPC tools/call Request
        const jsonRpcRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: toolArgs
          }
        }

        context.log(node.id, `Sending JSON-RPC request to MCP stdin`, 'info')
        mcpProcess.stdin?.write(JSON.stringify(jsonRpcRequest) + '\n')
      })
    } finally {
      unsubscribe()
    }
  },

  // 7. Custom JavaScript Code Node
  javascript: async (node, context) => {
    const code = node.data.code || ''
    context.log(node.id, `Running custom JavaScript code`, 'info')

    try {
      // Evaluate within a safe scope that has access to inputs & resolver
      const inputs = context.nodeOutputs
      const sandbox = { inputs, console: { log: (msg: any) => context.log(node.id, `[Console] ${String(msg)}`, 'info') } }
      
      const runFn = new Function('inputs', 'console', `
        ${code}
      `)
      
      const result = runFn(inputs, sandbox.console)
      context.log(node.id, `Code executed successfully`, 'success')
      return result || { success: true }
    } catch (err: any) {
      context.log(node.id, `Code execution failed: ${err.message}`, 'error')
      throw err
    }
  }
}
