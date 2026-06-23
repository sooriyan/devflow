import { useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Canvas } from './components/Canvas'
import { NodeEditor } from './components/NodeEditor'
import { ConsolePanel } from './components/ConsolePanel'
import { CredentialsSettings } from './components/CredentialsSettings'
import { ProPaywallModal } from './components/ProPaywallModal'
import { ScheduleModal } from './components/ScheduleModal'
import { useWorkflowStore } from './store/workflowStore'

function AppContent() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)

  const addLog = useWorkflowStore((state) => state.addLog)
  const updateNodeStatus = useWorkflowStore((state) => state.updateNodeStatus)
  const checkProStatus = useWorkflowStore((state) => state.checkProStatus)

  // Sync Pro status on startup
  useEffect(() => {
    checkProStatus()
  }, [checkProStatus])

  // Listen to Electron execution IPC events
  useEffect(() => {
    const unsubscribeLog = window.electronAPI.onWorkflowLog((log) => {
      addLog(log)
    })

    const unsubscribeStatus = (window.electronAPI.onWorkflowStatus as any)((status: any) => {
      updateNodeStatus(status.nodeId, {
        status: status.status,
        output: status.output,
        error: status.error
      })
    })

    return () => {
      unsubscribeLog()
      unsubscribeStatus()
    }
  }, [addLog, updateNodeStatus])

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden font-sans">
      {/* Topbar navigation and main actions */}
      <Topbar 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        isAiOpen={isAiOpen}
        onToggleAi={() => setIsAiOpen(!isAiOpen)}
        onOpenSchedule={() => setIsScheduleOpen(true)}
      />

      {/* Main workplace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side draggable palette */}
        <Sidebar />

        {/* Center Canvas area + Right property side drawer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <Canvas 
              isAiOpen={isAiOpen}
              onCloseAi={() => setIsAiOpen(false)}
              onOpenPaywall={() => setIsPaywallOpen(true)}
            />
            <NodeEditor />
          </div>

          {/* Bottom Execution Console logs */}
          <ConsolePanel />
        </div>
      </div>

      {/* Credentials Modal overlay */}
      <CredentialsSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Pro Paywall Modal overlay */}
      <ProPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
      />

      {/* Schedule Modal overlay */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onOpenPaywall={() => setIsPaywallOpen(true)}
      />
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  )
}
