import React from 'react'
import { Handle, Position } from '@xyflow/react'
import {
  Play,
  Terminal as TerminalIcon,
  GitBranch,
  GitPullRequest,
  ClipboardList,
  Cpu,
  Code2,
  CheckCircle2,
  XCircle,
  Loader2,
  Pause
} from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'

interface NodeProps {
  id: string
  data: {
    label: string
    [key: string]: any
  }
}

const NodeWrapper: React.FC<{
  nodeId: string
  icon: React.ReactNode
  colorClass: string
  children: React.ReactNode
  title: string
  subtitle?: string
}> = ({ nodeId, icon, colorClass, children, title, subtitle }) => {
  const nodeStatus = useWorkflowStore((state) => state.nodeStatuses[nodeId])
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId)
  const node = useWorkflowStore((state) => state.nodes.find(n => n.id === nodeId))
  
  const isSelected = selectedNodeId === nodeId
  const status = nodeStatus?.status || 'idle'
  const isPausedBreakpoint = node?.data?.isPaused === true

  let borderStyle = 'border-border'
  let glowStyle = ''

  if (isSelected) {
    borderStyle = 'border-primary'
  }

  if (status === 'running') {
    borderStyle = 'border-accent'
    glowStyle = 'glow-active'
  } else if (status === 'paused') {
    borderStyle = 'border-yellow-500'
    glowStyle = 'shadow-[0_0_15px_rgba(234,179,8,0.15)] animate-pulse'
  } else if (status === 'success') {
    borderStyle = 'border-accent-green'
    glowStyle = 'shadow-glow-green'
  } else if (status === 'error') {
    borderStyle = 'border-accent-red'
    glowStyle = 'shadow-glow-red'
  }

  return (
    <div
      className={`glass-panel rounded-xl px-4 py-3 min-w-[200px] border transition-all duration-300 ${borderStyle} ${glowStyle} text-foreground`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colorClass} text-white`}>
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-sm leading-tight">{title}</h4>
            {subtitle && <p className="text-[10px] text-zinc-500 font-mono leading-none mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Status / Breakpoint Badge */}
        <div className="flex items-center">
          {isPausedBreakpoint && status !== 'paused' && (
            <div className="flex items-center gap-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1 py-0.5 rounded text-[8px] font-semibold uppercase mr-1" title="Pause on reach">
              <Pause className="w-2 h-2 fill-current" />
              <span>Break</span>
            </div>
          )}
          {status === 'running' && (
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          )}
          {status === 'paused' && (
            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase">
              <Pause className="w-2.5 h-2.5 animate-pulse fill-current" />
              <span>Paused</span>
            </div>
          )}
          {status === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-accent-green" />
          )}
          {status === 'error' && (
            <XCircle className="w-4 h-4 text-accent-red" />
          )}
        </div>
      </div>
      
      <div className="text-[11px] text-zinc-400 font-mono line-clamp-1 py-1">
        {children}
      </div>
    </div>
  )
}

// 1. Manual Trigger Node
export const TriggerNode: React.FC<NodeProps> = ({ id, data }) => {
  return (
    <NodeWrapper nodeId={id} icon={<Play className="w-4 h-4 fill-current" />} colorClass="bg-accent-green" title={data.label || 'Manual Trigger'}>
      <span>Start Workflow</span>
      <Handle type="source" position={Position.Right} id="out" />
    </NodeWrapper>
  )
}

// 2. Terminal Command Node
export const TerminalNode: React.FC<NodeProps> = ({ id, data }) => {
  return (
    <NodeWrapper
      nodeId={id}
      icon={<TerminalIcon className="w-4 h-4" />}
      colorClass="bg-zinc-800 border border-zinc-700"
      title={data.label || 'Terminal Command'}
      subtitle={id}
    >
      <span className="font-mono text-zinc-500">{data.command || 'empty command'}</span>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </NodeWrapper>
  )
}

// 3. Git Operations Node
export const GitNode: React.FC<NodeProps> = ({ id, data }) => {
  return (
    <NodeWrapper nodeId={id} icon={<GitBranch className="w-4 h-4" />} colorClass="bg-accent-orange" title={data.label || 'Git Ops'} subtitle={id}>
      <span className="capitalize">{data.operation || 'branch'}</span>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </NodeWrapper>
  )
}

// 4. GitHub API Node
export const GithubNode: React.FC<NodeProps> = ({ id, data }) => {
  return (
    <NodeWrapper nodeId={id} icon={<GitPullRequest className="w-4 h-4" />} colorClass="bg-zinc-900 border border-zinc-800" title={data.label || 'GitHub'} subtitle={id}>
      <span className="capitalize">{data.operation?.replace('-', ' ') || 'create-pr'}</span>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </NodeWrapper>
  )
}

// 5. Jira Node
export const JiraNode: React.FC<NodeProps> = ({ id, data }) => {
  return (
    <NodeWrapper nodeId={id} icon={<ClipboardList className="w-4 h-4" />} colorClass="bg-accent" title={data.label || 'Jira'} subtitle={id}>
      <span className="capitalize">{data.operation || 'comment'}: {data.issueKey || 'No ticket'}</span>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </NodeWrapper>
  )
}

// 6. MCP Node
export const McpNode: React.FC<NodeProps> = ({ id, data }) => {
  return (
    <NodeWrapper nodeId={id} icon={<Cpu className="w-4 h-4" />} colorClass="bg-accent-purple" title={data.label || 'MCP'} subtitle={id}>
      <span>{data.toolName || 'Execute tool'}</span>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </NodeWrapper>
  )
}

// 7. JavaScript Node
export const JavascriptNode: React.FC<NodeProps> = ({ id, data }) => {
  return (
    <NodeWrapper nodeId={id} icon={<Code2 className="w-4 h-4" />} colorClass="bg-yellow-600" title={data.label || 'JS Code'} subtitle={id}>
      <span>Run custom script</span>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </NodeWrapper>
  )
}

// Export custom types object for React Flow registry
export const nodeTypes = {
  trigger: TriggerNode,
  terminal: TerminalNode,
  git: GitNode,
  github: GithubNode,
  jira: JiraNode,
  mcp: McpNode,
  javascript: JavascriptNode
}
