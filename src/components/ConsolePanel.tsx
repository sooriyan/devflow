import React, { useEffect, useRef, useState } from 'react'
import { Terminal, Trash2, Sparkles } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'

export const ConsolePanel: React.FC = () => {
  const logs = useWorkflowStore((state) => state.logs)
  const clearLogs = () => useWorkflowStore.setState({ logs: [] })
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<'all' | 'info' | 'error' | 'success' | 'warn'>('all')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const filteredLogs = logs.filter(
    (log) => filter === 'all' || log.type === filter
  )

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toTimeString().split(' ')[0]
    } catch {
      return ''
    }
  }

  return (
    <div className="h-56 border-t border-border flex flex-col glass-panel select-none">
      {/* Top Bar / Filters */}
      <div className="h-9 border-b border-border flex items-center justify-between px-4 bg-black/40">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-xs uppercase tracking-wider text-zinc-400">Execution Logs</span>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
            {(['all', 'info', 'success', 'warn', 'error'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold transition-colors cursor-pointer ${
                  filter === type
                    ? 'bg-zinc-800 text-foreground'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-border" />

          <button
            onClick={clearLogs}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-accent-red transition-colors cursor-pointer"
            title="Clear logs"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Log Console Body */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1 bg-black/20">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => {
            let typeColor = 'text-zinc-300'
            let typeBg = 'bg-zinc-800/40 text-zinc-400'

            if (log.type === 'success') {
              typeColor = 'text-accent-green'
              typeBg = 'bg-accent-green/10 text-accent-green'
            } else if (log.type === 'error') {
              typeColor = 'text-accent-red font-bold animate-pulse'
              typeBg = 'bg-accent-red/10 text-accent-red'
            } else if (log.type === 'warn') {
              typeColor = 'text-accent-orange'
              typeBg = 'bg-accent-orange/10 text-accent-orange'
            } else if (log.type === 'info') {
              typeColor = 'text-accent'
              typeBg = 'bg-accent/10 text-accent'
            }

            return (
              <div key={index} className="flex gap-2 items-start py-0.5 hover:bg-zinc-900/40 px-1 rounded transition-colors">
                <span className="text-zinc-600 flex-shrink-0">{formatTime(log.timestamp)}</span>
                <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] uppercase font-bold tracking-wide flex-shrink-0 ${typeBg}`}>
                  {log.nodeId === 'system' ? 'System' : log.nodeId.split('_')[0]}
                </span>
                <span className={`${typeColor} whitespace-pre-wrap break-all flex-1`}>{log.message}</span>
              </div>
            )
          })
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs gap-1.5 select-none">
            <Sparkles className="w-4 h-4 text-zinc-700 animate-pulse" />
            <span>Workflow terminal ready. Run a workflow to view output streams.</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
