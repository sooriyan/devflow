import { useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Canvas } from './components/Canvas'
import { NodeEditor } from './components/NodeEditor'
import { ConsolePanel } from './components/ConsolePanel'
import { CredentialsSettings } from './components/CredentialsSettings'
import { useWorkflowStore } from './store/workflowStore'

function AppContent() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const addLog = useWorkflowStore((state) => state.addLog)
  const updateNodeStatus = useWorkflowStore((state) => state.updateNodeStatus)

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
      <Topbar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main workplace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side draggable palette */}
        <Sidebar />

        {/* Center Canvas area + Right property side drawer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <Canvas />
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
