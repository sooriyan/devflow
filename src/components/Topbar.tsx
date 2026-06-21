import React, { useEffect, useState } from 'react'
import { Play, Square, Save, FolderOpen, Settings, Plus } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'

interface TopbarProps {
  onOpenSettings: () => void
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSettings }) => {
  const {
    currentWorkflowName,
    workflowsList,
    isRunning,
    runWorkflow,
    stopWorkflow,
    saveWorkflow,
    loadWorkflow,
    loadWorkflowsList,
    clearCanvas
  } = useWorkflowStore()

  const [workflowNameInput, setWorkflowNameInput] = useState(currentWorkflowName)
  const [selectedWorkflow, setSelectedWorkflow] = useState('')

  useEffect(() => {
    loadWorkflowsList()
  }, [])

  useEffect(() => {
    setWorkflowNameInput(currentWorkflowName)
  }, [currentWorkflowName])

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

  return (
    <div className="h-14 border-b border-border flex items-center justify-between px-6 glass-panel select-none z-10">
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
        <div className="flex items-center gap-2">
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
      <div className="flex items-center gap-3">
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
      <div className="flex items-center gap-3">
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
