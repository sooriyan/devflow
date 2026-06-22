import React, { useCallback, useRef, useState } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  useReactFlow,
  BackgroundVariant
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useWorkflowStore } from '../store/workflowStore'
import { nodeTypes } from './CustomNodes'
import { Play, Pause, SkipForward } from 'lucide-react'

export const Canvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    node: any
  } | null>(null)
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    isRunning,
    nodeStatuses,
    updateNodeData
  } = useWorkflowStore()

  const { screenToFlowPosition } = useReactFlow()

  const isPaused = Object.values(nodeStatuses).some((s) => s.status === 'paused')

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current) return

      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type) {
        return
      }

      // Convert client screen coordinates to local canvas coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      addNode(type, position.x - 100, position.y - 40)
    },
    [screenToFlowPosition, addNode]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  const onPaneClick = useCallback(() => {
    selectNode(null)
    setContextMenu(null)
  }, [selectNode])

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault()
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        node,
      })
    },
    []
  )

  return (
    <div className="flex-1 h-full w-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onDragOver={onDragOver}
        onDrop={onDrop}
        proOptions={{ hideAttribution: true }}
        fitView
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#27272a"
        />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
      
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
          <div className="text-center p-6 bg-zinc-900/40 rounded-2xl border border-border max-w-sm backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-zinc-300">Empty Flow Canvas</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Drag nodes from the left sidebar and connect their terminals to begin building your automation pipeline.
            </p>
          </div>
        </div>
      )}

      {/* Node Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu(null)
            }}
          />
          <div
            className="absolute z-50 min-w-[200px] glass-panel rounded-xl border border-border shadow-2xl p-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
              position: 'fixed',
            }}
          >
            {/* Toggle Pause Breakpoint */}
            <button
              onClick={() => {
                const currentIsPaused = contextMenu.node.data?.isPaused === true
                updateNodeData(contextMenu.node.id, { isPaused: !currentIsPaused })
                setContextMenu(null)
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer animate-none"
            >
              <div className="flex items-center gap-2">
                <Pause
                  className={`w-3.5 h-3.5 ${
                    contextMenu.node.data?.isPaused ? 'text-orange-400 fill-current' : 'text-zinc-500'
                  }`}
                />
                <span>{contextMenu.node.data?.isPaused ? 'Remove Breakpoint' : 'Pause on Reach'}</span>
              </div>
              {!contextMenu.node.data?.isPaused && (
                <span className="text-[10px] text-zinc-500 font-mono">Break</span>
              )}
            </button>

            <div className="h-[1px] bg-border my-1" />

            {/* Pause Current Execution */}
            <button
              disabled={!isRunning || isPaused}
              onClick={async () => {
                await window.electronAPI.pauseWorkflow()
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-zinc-300 hover:text-white hover:bg-zinc-800/80 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 text-yellow-500" />
              <span>Pause Execution</span>
            </button>

            {/* Resume / Unpause Execution */}
            <button
              disabled={!isRunning || !isPaused}
              onClick={async () => {
                await window.electronAPI.resumeWorkflow()
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-zinc-300 hover:text-white hover:bg-zinc-800/80 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-accent-green fill-current" />
              <span>Unpause Execution</span>
            </button>

            {/* Proceed with next node */}
            <button
              disabled={!isRunning || !isPaused}
              onClick={async () => {
                await window.electronAPI.proceedWorkflow()
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-zinc-300 hover:text-white hover:bg-zinc-800/80 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 text-accent" />
              <span>Proceed to Next Node</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
export default Canvas
