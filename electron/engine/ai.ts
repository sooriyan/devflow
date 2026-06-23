import { safeStorage } from 'electron'

interface Position {
  x: number
  y: number
}

interface WorkflowNode {
  id: string
  type: string
  position: Position
  data: Record<string, any>
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
  animated?: boolean
}

interface WorkflowResponse {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

const SYSTEM_PROMPT = `You are an expert developer assistant specialized in constructing automated DevFlow pipelines.
Based on the user's requirements, generate a JSON object containing a list of nodes and connection edges.

Available Node Types & Allowed Data Schemas:
1. "trigger": Starting node. No custom properties. Label: "Start Workflow" or "Manual Trigger".
2. "terminal": Executes shell commands.
   Properties: { command: string, cwd?: string, envVars?: string, showLogs?: boolean }
3. "git": Performs Git operations.
   Properties: { operation: 'branch'|'checkout'|'commit'|'push'|'pull'|'clone', branchName?: string, commitMessage?: string, commitHash?: string, remote?: string, cwd?: string }
4. "github": GitHub API integrations.
   Properties: { operation: 'create-pr'|'merge-pr'|'create-comment', owner: string, repo: string, prTitle?: string, headBranch?: string, baseBranch?: string, prBody?: string, prNumber?: string, commentBody?: string }
5. "jira": Jira integrations.
   Properties: { operation: 'comment'|'transition-issue'|'create-issue', issueKey: string, comment?: string, transitionName?: string }
6. "mcp": Invokes Model Context Protocol tools.
   Properties: { serverCmd: string, serverArgs: string, toolName: string, toolArgs: string }
7. "javascript": Executes custom javascript logic.
   Properties: { code: string }
8. "subworkflow": Executes a nested sub-workflow.
   Properties: { subWorkflowName: string }
9. "dependency": Manages dependencies in package.json.
   Properties: { cwd?: string, dependencyName: string, targetVersion: string }

Connection Rules:
- The first node MUST be a "trigger" node.
- Connect nodes from left to right sequentially.
- Every node except the "trigger" has a target input handle ID "in" (left side) and a source output handle ID "out" (right side). The "trigger" node only has a source handle ID "out".
- Set connection edge: { id: string, source: string, target: string, sourceHandle: "out", targetHandle: "in", animated: true }

Layout Rules:
- The trigger node should start at coordinates { x: 50, y: 250 }.
- Space sequential nodes horizontally: increment 'x' coordinate by 320px for each node step.
- For parallel branches, adjust 'y' coordinate by +150px or -150px.

Your response must be a single, raw, valid JSON object matching this schema. Do not write explanations or wrap it in anything other than the requested JSON structure.

JSON Schema format to follow:
{
  "nodes": [
    {
      "id": "string (e.g. trigger_1, terminal_1, git_1)",
      "type": "string (trigger|terminal|git|github|jira|mcp|javascript|subworkflow|dependency)",
      "position": { "x": number, "y": number },
      "data": { "label": "string", ...customProperties }
    }
  ],
  "edges": [
    {
      "id": "string (e.g. e_trigger_1-terminal_1)",
      "source": "string",
      "target": "string",
      "sourceHandle": "out",
      "targetHandle": "in",
      "animated": true
    }
  ]
}
`

// Schema definition for Gemini Structured Output API
const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    nodes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          type: { type: 'STRING', enum: ["trigger", "terminal", "git", "github", "jira", "mcp", "javascript", "subworkflow", "dependency"] },
          position: {
            type: 'OBJECT',
            properties: {
              x: { type: 'NUMBER' },
              y: { type: 'NUMBER' }
            },
            required: ['x', 'y']
          },
          data: {
            type: 'OBJECT',
            properties: {
              label: { type: 'STRING' },
              command: { type: 'STRING' },
              cwd: { type: 'STRING' },
              envVars: { type: 'STRING' },
              showLogs: { type: 'BOOLEAN' },
              operation: { type: 'STRING' },
              branchName: { type: 'STRING' },
              commitMessage: { type: 'STRING' },
              commitHash: { type: 'STRING' },
              remote: { type: 'STRING' },
              owner: { type: 'STRING' },
              repo: { type: 'STRING' },
              prTitle: { type: 'STRING' },
              headBranch: { type: 'STRING' },
              baseBranch: { type: 'STRING' },
              prBody: { type: 'STRING' },
              prNumber: { type: 'STRING' },
              commentBody: { type: 'STRING' },
              issueKey: { type: 'STRING' },
              comment: { type: 'STRING' },
              transitionName: { type: 'STRING' },
              serverCmd: { type: 'STRING' },
              serverArgs: { type: 'STRING' },
              toolName: { type: 'STRING' },
              toolArgs: { type: 'STRING' },
              code: { type: 'STRING' },
              subWorkflowName: { type: 'STRING' },
              dependencyName: { type: 'STRING' },
              targetVersion: { type: 'STRING' }
            },
            required: ['label']
          }
        },
        required: ['id', 'type', 'position', 'data']
      }
    },
    edges: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          source: { type: 'STRING' },
          target: { type: 'STRING' },
          sourceHandle: { type: 'STRING' },
          targetHandle: { type: 'STRING' },
          animated: { type: 'BOOLEAN' }
        },
        required: ['id', 'source', 'target', 'sourceHandle', 'targetHandle']
      }
    }
  },
  required: ['nodes', 'edges']
}

export async function generateWorkflow(
  provider: string,
  model: string,
  prompt: string,
  apiKey: string
): Promise<WorkflowResponse> {
  const fullPrompt = `Generate a workflow for the following requirement: "${prompt}"`

  try {
    let resultText = ''

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: GEMINI_RESPONSE_SCHEMA,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API error (${response.status}): ${errorText}`)
      }

      const resData = (await response.json()) as any
      resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } else if (provider === 'openai' || provider === 'deepseek') {
      const baseUrl =
        provider === 'openai'
          ? 'https://api.openai.com/v1/chat/completions'
          : 'https://api.deepseek.com/v1/chat/completions'

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: fullPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`${provider === 'openai' ? 'OpenAI' : 'DeepSeek'} API error (${response.status}): ${errorText}`)
      }

      const resData = (await response.json()) as any
      resultText = resData.choices?.[0]?.message?.content || ''
    } else if (provider === 'anthropic') {
      const url = 'https://api.anthropic.com/v1/messages'
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: fullPrompt }],
          temperature: 0.1,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Anthropic API error (${response.status}): ${errorText}`)
      }

      const resData = (await response.json()) as any
      resultText = resData.content?.[0]?.text || ''
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`)
    }

    // Clean code fences if LLM included them (especially common with Anthropic Claude)
    let cleanedText = resultText.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7)
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.substring(3)
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3)
    }
    cleanedText = cleanedText.trim()

    const parsed = JSON.parse(cleanedText) as WorkflowResponse
    if (!parsed.nodes || !parsed.edges) {
      throw new Error('API returned an invalid workflow structure (missing nodes or edges).')
    }

    return parsed
  } catch (err: any) {
    console.error('Failed to generate workflow via AI:', err)
    throw new Error(err.message || 'Unknown error during workflow generation.')
  }
}
