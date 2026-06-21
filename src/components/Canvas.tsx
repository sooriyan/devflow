import React, { useCallback, useRef } from 'react'
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

export const Canvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode
  } = useWorkflowStore()

  const { screenToFlowPosition } = useReactFlow()

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
  }, [selectNode])

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
        onDragOver={onDragOver}
        onDrop={onDrop}
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
    </div>
  )
}
export default Canvas
