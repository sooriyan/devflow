import React from 'react'
import { X, Trash2, Info, FolderOpen } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'

export const NodeEditor: React.FC = () => {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId)
  const node = useWorkflowStore((state) => state.nodes.find((n) => n.id === selectedNodeId))
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const removeNode = useWorkflowStore((state) => state.removeNode)
  const selectNode = useWorkflowStore((state) => state.selectNode)

  if (!node) {
    return (
      <div className="w-80 border-l border-border h-full flex items-center justify-center p-6 text-center text-zinc-500 text-xs glass-panel select-none">
        <div>
          <Info className="w-5 h-5 mx-auto mb-2 text-zinc-600" />
          Select a node on the canvas to configure its settings.
        </div>
      </div>
    )
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(node.id, { label: e.target.value })
  }

  const handleDataChange = (key: string, value: any) => {
    updateNodeData(node.id, { [key]: value })
  }

  return (
    <div className="w-80 border-l border-border h-full flex flex-col glass-panel select-none text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Node Properties</h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{node.id}</p>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="text-zinc-400 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Node Name</label>
          <input
            type="text"
            value={node.data.label || ''}
            onChange={handleLabelChange}
            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="h-[1px] bg-border my-2" />

        {/* Dynamic Fields by Type */}

        {/* 1. Terminal Node */}
        {node.type === 'terminal' && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Terminal Command</label>
              <textarea
                value={node.data.command || ''}
                onChange={(e) => handleDataChange('command', e.target.value)}
                rows={4}
                placeholder='e.g., npm run test'
                className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono transition-colors"
              />
              <p className="text-[10px] text-zinc-500">Supports variable bindings like <code>{`{{ NodeLabel.stdout }}`}</code></p>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Shell / Terminal Type</label>
              <select
                value={node.data.shellType || 'default'}
                onChange={(e) => handleDataChange('shellType', e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="default">Default System Shell</option>
                <option value="bash">Bash</option>
                <option value="zsh">Zsh</option>
                <option value="powershell">PowerShell</option>
                <option value="cmd">Windows CMD</option>
                <option value="custom">Custom Shell Path...</option>
              </select>
            </div>

            {node.data.shellType === 'custom' && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Custom Shell Path</label>
                <input
                  type="text"
                  value={node.data.customShell || ''}
                  onChange={(e) => handleDataChange('customShell', e.target.value)}
                  placeholder="e.g. /bin/bash or C:\bin\bash.exe"
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Working Directory (CWD)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={node.data.cwd || ''}
                  onChange={(e) => handleDataChange('cwd', e.target.value)}
                  placeholder="Defaults to current folder"
                  className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const path = await window.electronAPI.selectDirectory()
                    if (path) {
                      handleDataChange('cwd', path)
                    }
                  }}
                  className="px-2.5 bg-zinc-800 hover:bg-zinc-700 border border-border hover:border-zinc-500 rounded-lg text-xs text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title="Browse folder"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* 2. Git Node */}
        {node.type === 'git' && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Git Operation</label>
              <select
                value={node.data.operation || 'branch'}
                onChange={(e) => handleDataChange('operation', e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="branch">Create/Checkout Branch</option>
                <option value="commit">Stage & Commit Changes</option>
                <option value="cherry-pick">Cherry Pick Commit</option>
                <option value="push">Push Code to Remote</option>
              </select>
            </div>

            {node.data.operation === 'branch' && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Branch Name</label>
                <input
                  type="text"
                  value={node.data.branchName || ''}
                  onChange={(e) => handleDataChange('branchName', e.target.value)}
                  placeholder="e.g. feature/auth-fix"
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            {node.data.operation === 'commit' && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Commit Message</label>
                <input
                  type="text"
                  value={node.data.commitMessage || ''}
                  onChange={(e) => handleDataChange('commitMessage', e.target.value)}
                  placeholder="e.g. fix: resolv auth bug"
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            {node.data.operation === 'cherry-pick' && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Commit Hash</label>
                <input
                  type="text"
                  value={node.data.commitHash || ''}
                  onChange={(e) => handleDataChange('commitHash', e.target.value)}
                  placeholder="e.g. a7f6d5c"
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono transition-colors"
                />
              </div>
            )}

            {node.data.operation === 'push' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Remote</label>
                  <input
                    type="text"
                    value={node.data.remote || 'origin'}
                    onChange={(e) => handleDataChange('remote', e.target.value)}
                    placeholder="origin"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Branch Name</label>
                  <input
                    type="text"
                    value={node.data.branchName || ''}
                    onChange={(e) => handleDataChange('branchName', e.target.value)}
                    placeholder="e.g. main"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Working Directory (CWD)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={node.data.cwd || ''}
                  onChange={(e) => handleDataChange('cwd', e.target.value)}
                  placeholder="Defaults to current folder"
                  className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const path = await window.electronAPI.selectDirectory()
                    if (path) {
                      handleDataChange('cwd', path)
                    }
                  }}
                  className="px-2.5 bg-zinc-800 hover:bg-zinc-700 border border-border hover:border-zinc-500 rounded-lg text-xs text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title="Browse folder"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* 3. GitHub Node */}
        {node.type === 'github' && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">GitHub Operation</label>
              <select
                value={node.data.operation || 'create-pr'}
                onChange={(e) => handleDataChange('operation', e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="create-pr">Create Pull Request (Draft)</option>
                <option value="pr-comment">Add PR Comment</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Repository Owner (User/Org)</label>
              <input
                type="text"
                value={node.data.owner || ''}
                onChange={(e) => handleDataChange('owner', e.target.value)}
                placeholder="e.g. octocat"
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Repository Name</label>
              <input
                type="text"
                value={node.data.repo || ''}
                onChange={(e) => handleDataChange('repo', e.target.value)}
                placeholder="e.g. Hello-World"
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {node.data.operation === 'create-pr' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">PR Title</label>
                  <input
                    type="text"
                    value={node.data.prTitle || ''}
                    onChange={(e) => handleDataChange('prTitle', e.target.value)}
                    placeholder="e.g. Feature: Adds auth support"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Head Branch (Source)</label>
                  <input
                    type="text"
                    value={node.data.headBranch || ''}
                    onChange={(e) => handleDataChange('headBranch', e.target.value)}
                    placeholder="e.g. feature/auth"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Base Branch (Target)</label>
                  <input
                    type="text"
                    value={node.data.baseBranch || 'main'}
                    onChange={(e) => handleDataChange('baseBranch', e.target.value)}
                    placeholder="main"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">PR Description (Body)</label>
                  <textarea
                    value={node.data.prBody || ''}
                    onChange={(e) => handleDataChange('prBody', e.target.value)}
                    rows={3}
                    placeholder="Describe changes..."
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </>
            )}

            {node.data.operation === 'pr-comment' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Pull Request Number</label>
                  <input
                    type="text"
                    value={node.data.prNumber || ''}
                    onChange={(e) => handleDataChange('prNumber', e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Comment Body</label>
                  <textarea
                    value={node.data.commentBody || ''}
                    onChange={(e) => handleDataChange('commentBody', e.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* 4. Jira Node */}
        {node.type === 'jira' && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Jira Operation</label>
              <select
                value={node.data.operation || 'comment'}
                onChange={(e) => handleDataChange('operation', e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="comment">Add Ticket Comment</option>
                <option value="transition">Transition Issue Status</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Issue Key</label>
              <input
                type="text"
                value={node.data.issueKey || ''}
                onChange={(e) => handleDataChange('issueKey', e.target.value)}
                placeholder="e.g. PROJ-123"
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {node.data.operation === 'comment' && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Comment Body</label>
                <textarea
                  value={node.data.comment || ''}
                  onChange={(e) => handleDataChange('comment', e.target.value)}
                  rows={3}
                  placeholder="Ticket comment text..."
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            {node.data.operation === 'transition' && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Transition Name or ID</label>
                <input
                  type="text"
                  value={node.data.transitionName || ''}
                  onChange={(e) => handleDataChange('transitionName', e.target.value)}
                  placeholder="e.g. In Progress, Done"
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}
          </>
        )}

        {/* 5. MCP Node */}
        {node.type === 'mcp' && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Server Command</label>
              <input
                type="text"
                value={node.data.serverCmd || 'npx'}
                onChange={(e) => handleDataChange('serverCmd', e.target.value)}
                placeholder="e.g., npx, node, python"
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Server Arguments</label>
              <input
                type="text"
                value={node.data.serverArgs || ''}
                onChange={(e) => handleDataChange('serverArgs', e.target.value)}
                placeholder="e.g., -y @modelcontextprotocol/server-filesystem /path"
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Tool Name</label>
              <input
                type="text"
                value={node.data.toolName || ''}
                onChange={(e) => handleDataChange('toolName', e.target.value)}
                placeholder="e.g., write_file"
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Tool Arguments (JSON)</label>
              <textarea
                value={node.data.toolArgs || '{}'}
                onChange={(e) => handleDataChange('toolArgs', e.target.value)}
                rows={3}
                placeholder='e.g., { "path": "file.txt", "content": "hello" }'
                className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono transition-colors"
              />
            </div>
          </>
        )}

        {/* 6. Custom Javascript Node */}
        {node.type === 'javascript' && (
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">JavaScript Execution Code</label>
            <textarea
              value={node.data.code || ''}
              onChange={(e) => handleDataChange('code', e.target.value)}
              rows={12}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-[10px] text-foreground focus:outline-none focus:border-primary font-mono transition-colors"
            />
            <p className="text-[10px] text-zinc-500">
              Access other node results using <code>inputs["Node_ID"].field</code>. Return an object to pass to downstream nodes.
            </p>
          </div>
        )}
      </div>

      {/* Delete button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={() => removeNode(node.id)}
          className="w-full flex items-center justify-center gap-2 py-2 border border-accent-red/30 bg-accent-red/10 text-accent-red hover:bg-accent-red/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node</span>
        </button>
      </div>
    </div>
  )
}
