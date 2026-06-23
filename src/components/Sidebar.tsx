import React, { useState } from 'react'
import {
  Play,
  Terminal,
  GitBranch,
  GitPullRequest,
  ClipboardList,
  Cpu,
  Code2,
  Search,
  Layers,
  Package
} from 'lucide-react'

interface NodeItem {
  type: string
  label: string
  description: string
  icon: React.ReactNode
  colorClass: string
}

export const Sidebar: React.FC = () => {
  const [search, setSearch] = useState('')

  const nodes: NodeItem[] = [
    // Triggers
    {
      type: 'trigger',
      label: 'Manual Trigger',
      description: 'Trigger workflow run manually',
      icon: <Play className="w-4 h-4 fill-current" />,
      colorClass: 'bg-accent-green text-white'
    },
    // Shell & Code
    {
      type: 'terminal',
      label: 'Terminal Command',
      description: 'Run shell commands locally',
      icon: <Terminal className="w-4 h-4" />,
      colorClass: 'bg-zinc-800 text-zinc-100 border border-zinc-700'
    },
    {
      type: 'javascript',
      label: 'JS Code Block',
      description: 'Process inputs with JS scripting',
      icon: <Code2 className="w-4 h-4" />,
      colorClass: 'bg-yellow-600 text-white'
    },
    // Git
    {
      type: 'git',
      label: 'Git Operation',
      description: 'Commit, branch, push, cherry-pick',
      icon: <GitBranch className="w-4 h-4" />,
      colorClass: 'bg-accent-orange text-white'
    },
    // APIs
    {
      type: 'github',
      label: 'GitHub PRs',
      description: 'Manage PRs and comments',
      icon: <GitPullRequest className="w-4 h-4" />,
      colorClass: 'bg-zinc-900 text-zinc-100 border border-zinc-800'
    },
    {
      type: 'jira',
      label: 'Jira Comments/Status',
      description: 'Transition tickets & add comments',
      icon: <ClipboardList className="w-4 h-4" />,
      colorClass: 'bg-accent text-white'
    },
    {
      type: 'mcp',
      label: 'MCP Tool Call',
      description: 'Invoke Model Context Protocol tools',
      icon: <Cpu className="w-4 h-4" />,
      colorClass: 'bg-accent-purple text-white'
    },
    {
      type: 'subworkflow',
      label: 'Sub-Workflow',
      description: 'Run another workflow inside this flow',
      icon: <Layers className="w-4 h-4" />,
      colorClass: 'bg-indigo-600 text-white'
    },
    {
      type: 'dependency',
      label: 'Manage Dependency',
      description: 'Switch package/branch in package.json & clean node_modules',
      icon: <Package className="w-4 h-4" />,
      colorClass: 'bg-pink-600 text-white'
    }
  ]

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const filteredNodes = nodes.filter(
    (n) =>
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-72 border-r border-border h-full flex flex-col glass-panel select-none">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Node Palette</h3>
        <p className="text-xs text-zinc-500 mt-1">Drag and drop nodes onto the canvas to construct workflows.</p>
        
        {/* Search */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
          />
        </div>
      </div>

      {/* Nodes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredNodes.length > 0 ? (
          filteredNodes.map((node) => (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              className="glass-panel border border-border rounded-xl p-3 flex gap-3 hover:border-zinc-500 hover:scale-[1.02] cursor-grab transition-all duration-200 group active:cursor-grabbing"
            >
              <div className={`p-2 rounded-lg h-fit flex-shrink-0 ${node.colorClass}`}>
                {node.icon}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  {node.label}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {node.description}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-xs text-zinc-500">
            No matching nodes found.
          </div>
        )}
      </div>
    </div>
  )
}
