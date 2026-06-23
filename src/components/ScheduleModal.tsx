import React, { useState, useEffect } from 'react'
import { X, Clock, Lock, Save, AlertCircle, CalendarDays } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenPaywall: () => void
}

const COMMON_SCHEDULES = [
  { label: 'Every Minute (Testing)', value: '* * * * *' },
  { label: 'Every 15 Minutes', value: '*/15 * * * *' },
  { label: 'Every Hour', value: '0 * * * *' },
  { label: 'Every Day (Midnight)', value: '0 0 * * *' },
  { label: 'Every Week (Sunday)', value: '0 0 * * 0' }
]

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onOpenPaywall }) => {
  const {
    isPro,
    isProBypassed,
    workflowSchedule,
    setWorkflowSchedule,
    saveWorkflow,
    currentWorkflowName
  } = useWorkflowStore()

  const [enabled, setEnabled] = useState(false)
  const [cronExpression, setCronExpression] = useState('0 * * * *')
  const [customExpression, setCustomExpression] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('0 * * * *')
  const [errorMsg, setErrorMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const isProUser = isPro || isProBypassed

  // Load schedule state when modal opens
  useEffect(() => {
    if (isOpen) {
      const schedule = workflowSchedule
      const timer = setTimeout(() => {
        if (schedule) {
          setEnabled(schedule.enabled)
          setCronExpression(schedule.cronExpression)
          
          // Find if preset matches
          const presetMatch = COMMON_SCHEDULES.find((s) => s.value === schedule.cronExpression)
          if (presetMatch) {
            setSelectedPreset(schedule.cronExpression)
            setCustomExpression('')
          } else {
            setSelectedPreset('custom')
            setCustomExpression(schedule.cronExpression)
          }
        } else {
          setEnabled(false)
          setCronExpression('0 * * * *')
          setSelectedPreset('0 * * * *')
          setCustomExpression('')
        }
        setErrorMsg('')
        setStatusMsg('')
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, workflowSchedule])

  if (!isOpen) return null

  const validateCron = (expr: string): boolean => {
    const parts = expr.trim().split(/\s+/)
    if (parts.length !== 5) {
      setErrorMsg('Cron expression must have exactly 5 fields (minute hour day-of-month month day-of-week).')
      return false
    }
    setErrorMsg('')
    return true
  }

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedPreset(value)
    if (value !== 'custom') {
      setCronExpression(value)
      setErrorMsg('')
    } else {
      setCronExpression(customExpression || '* * * * *')
    }
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomExpression(value)
    setCronExpression(value)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg('Saving schedule...')
    
    if (enabled && !validateCron(cronExpression)) {
      setStatusMsg('')
      return
    }

    try {
      const newSchedule = {
        enabled,
        cronExpression: cronExpression.trim()
      }
      setWorkflowSchedule(newSchedule)
      
      // Save workflow file to write the schedule inside it
      await saveWorkflow(currentWorkflowName)
      
      setStatusMsg('Schedule updated successfully!')
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err: unknown) {
      console.error(err)
      setErrorMsg((err as Error).message || 'Failed to save schedule settings.')
      setStatusMsg('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-panel border border-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative select-none">
        
        {/* locked paywall view for non-pro */}
        {!isProUser && (
          <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mb-3 animate-pulse">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">DevFlow Pro Required</h4>
            <p className="text-[11px] text-zinc-500 mt-1 mb-4 leading-relaxed max-w-xs">
              Scheduled background cron jobs is a Pro feature. Upgrade to Pro for ₹100 lifetime access.
            </p>
            <div className="flex gap-2 w-full max-w-[240px]">
              <button
                onClick={() => {
                  onClose()
                  onOpenPaywall()
                }}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-semibold text-xs rounded-lg shadow-glow cursor-pointer transition-all active:scale-[0.98]"
              >
                Unlock Pro
              </button>
              <button
                onClick={onClose}
                className="px-3 py-2 border border-border hover:border-zinc-500 text-zinc-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Schedule Workflow</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Configure this workflow to run automatically in the background at regular intervals. Runs headlessly even when the editor window is closed.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-between bg-zinc-900/40 p-3 border border-border rounded-xl">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-zinc-400" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200">Enable Schedule</span>
                <span className="text-[10px] text-zinc-500 font-mono">Status: {enabled ? 'Active' : 'Disabled'}</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white peer-checked:after:border-white"></div>
            </label>
          </div>

          {enabled && (
            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Preset Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Interval Preset</label>
                <select
                  value={selectedPreset}
                  onChange={handlePresetChange}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {COMMON_SCHEDULES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                  <option value="custom">Custom Cron Expression...</option>
                </select>
              </div>

              {/* Custom Expression input */}
              {selectedPreset === 'custom' && (
                <div className="space-y-1 animate-in fade-in duration-100">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Cron Expression</label>
                  <input
                    type="text"
                    value={customExpression}
                    onChange={handleCustomChange}
                    placeholder="* * * * * (min hour day-of-month month day-of-week)"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono transition-colors"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Standard 5-field syntax. Example: <code>*/15 * * * *</code> (every 15 min).
                  </p>
                </div>
              )}

              {/* Display current expression info */}
              <div className="p-3 bg-zinc-900/60 border border-border/60 rounded-xl flex items-center justify-between text-xs text-zinc-300 font-mono">
                <span className="text-zinc-500">Cron Target:</span>
                <span className="text-primary font-bold text-[11px]">{cronExpression}</span>
              </div>
            </div>
          )}

          {/* Validation Feedback */}
          {errorMsg && (
            <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 text-red-400 text-[10px] p-2.5 rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="text-xs text-center text-primary font-semibold py-1">
              {statusMsg}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border hover:border-zinc-500 hover:text-foreground text-zinc-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-glow transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default ScheduleModal
