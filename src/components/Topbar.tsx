import React, { useEffect, useState } from 'react'
import { Play, Square, Save, FolderOpen, Settings, Plus, Sparkles, Clock } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'

interface TopbarProps {
  onOpenSettings: () => void
  isAiOpen: boolean
  onToggleAi: () => void
  onOpenSchedule: () => void
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSettings, isAiOpen, onToggleAi, onOpenSchedule }) => {
  const isPro = useWorkflowStore((state) => state.isPro)
  const isProBypassed = useWorkflowStore((state) => state.isProBypassed)
  const {
    currentWorkflowName,
    workflowsList,
    isRunning,
    runWorkflow,
    stopWorkflow,
    saveWorkflow,
    loadWorkflow,
    loadWorkflowsList,
    clearCanvas,
    workflowSchedule
  } = useWorkflowStore()

  const [workflowNameInput, setWorkflowNameInput] = useState(currentWorkflowName)
  const [selectedWorkflow, setSelectedWorkflow] = useState('')
  const [prevWorkflowName, setPrevWorkflowName] = useState(currentWorkflowName)

  if (currentWorkflowName !== prevWorkflowName) {
    setWorkflowNameInput(currentWorkflowName)
    setPrevWorkflowName(currentWorkflowName)
  }

  useEffect(() => {
    loadWorkflowsList()
  }, [loadWorkflowsList])

  const handleSave = () => {
    const name = workflowNameInput.trim() || 'untitled-workflow'
    saveWorkflow(name)
  }

  const handleLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value
    if (name) {
      loadWorkflow(name)
      setSelectedWorkflow(name)
    }
  }

  const isMac = typeof window !== 'undefined' && (
    (window.electronAPI && window.electronAPI.platform === 'darwin') ||
    navigator.userAgent.toLowerCase().includes('mac')
  )

  return (
    <div 
      className={`h-14 border-b border-border flex items-center justify-between glass-panel select-none z-10 ${
        isMac ? 'pl-20 pr-6' : 'pl-6 pr-36'
      }`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Brand & Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent-purple flex items-center justify-center font-bold text-white shadow-glow">
            D
          </div>
          <span className="font-semibold text-sm tracking-wider uppercase text-foreground">
            Dev<span className="text-primary">Flow</span>
          </span>
        </div>
        <div className="h-4 w-[1px] bg-border" />
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <input
            type="text"
            value={workflowNameInput}
            onChange={(e) => setWorkflowNameInput(e.target.value)}
            placeholder="untitled-workflow"
            className="bg-transparent font-medium text-sm text-foreground focus:outline-none focus:border-b focus:border-zinc-500 max-w-[200px]"
          />
        </div>
      </div>

      {/* Center File Operations */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => {
            clearCanvas()
            setWorkflowNameInput('untitled-workflow')
            setSelectedWorkflow('')
          }}
          className="p-1.5 rounded-lg border border-border text-zinc-400 hover:text-foreground hover:border-zinc-500 transition-colors"
          title="New Workflow"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-zinc-400 hover:text-foreground hover:border-zinc-500 text-xs transition-colors"
          title="Save Workflow"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        <div className="relative flex items-center">
          <FolderOpen className="w-3.5 h-3.5 text-zinc-500 absolute left-2 pointer-events-none" />
          <select
            value={selectedWorkflow}
            onChange={handleLoad}
            className="bg-background border border-border rounded-lg pl-8 pr-6 py-1.5 text-xs text-zinc-400 focus:outline-none hover:border-zinc-500 transition-colors cursor-pointer appearance-none"
          >
            <option value="">Load Workflow...</option>
            {workflowsList.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Execution Operations */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {isRunning ? (
          <button
            onClick={stopWorkflow}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent-red hover:bg-red-600 text-white font-semibold text-xs shadow-glow-red transition-all cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Execution</span>
          </button>
        ) : (
          <button
            onClick={runWorkflow}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-glow transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Workflow</span>
          </button>
        )}

        <button
          onClick={onToggleAi}
          className={`p-2 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            isAiOpen
              ? 'bg-primary/20 border-primary text-primary shadow-glow'
              : isPro || isProBypassed
                ? 'border-yellow-500/40 hover:border-yellow-400 text-yellow-500/80 hover:text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.05)]'
                : 'border-border text-zinc-400 hover:text-foreground hover:border-zinc-500'
          }`}
          title="AI Flow Assistant"
        >
          <Sparkles className={`w-4 h-4 ${isPro || isProBypassed ? 'text-yellow-500' : ''} ${isAiOpen ? 'animate-pulse' : ''}`} />
          {(isPro || isProBypassed) && (
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-yellow-500 font-mono">Pro</span>
          )}
        </button>

        <button
          onClick={onOpenSchedule}
          className={`p-2 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            workflowSchedule?.enabled
              ? 'bg-primary/20 border-primary text-primary shadow-glow'
              : 'border-border text-zinc-400 hover:text-foreground hover:border-zinc-500'
          }`}
          title="Schedule Workflow (Cron)"
        >
          <Clock className={`w-4 h-4 ${workflowSchedule?.enabled ? 'animate-pulse' : ''}`} />
          {workflowSchedule?.enabled && (
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary font-mono">Active</span>
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg border border-border text-zinc-400 hover:text-foreground hover:border-zinc-500 transition-colors"
          title="Credentials Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
