import { nodeExecutors, resolveVariables, ExecutionContext } from './nodeRegistry'
import { BrowserWindow } from 'electron'

interface Edge {
  source: string
  target: string
}

interface Node {
  id: string
  type: string
  data: any
}

interface Workflow {
  nodes: Node[]
  edges: Edge[]
}

export class WorkflowExecutor {
  private isCancelled = false
  private isPaused = false
  private pausedNodeId: string | null = null
  private pausePromiseResolve: (() => void) | null = null
  private proceedNext = false
  private activeNodeId: string | null = null
  private window: BrowserWindow
  private cancelCallbacks = new Set<() => void>()

  constructor(window: BrowserWindow) {
    this.window = window
  }

  cancel() {
    this.isCancelled = true
    this.isPaused = false
    if (this.pausePromiseResolve) {
      this.pausePromiseResolve()
    }
    for (const callback of this.cancelCallbacks) {
      try {
        callback()
      } catch (err) {
        console.error('Error running execution cancel callback:', err)
      }
    }
    if (this.activeNodeId) {
      this.log(this.activeNodeId, 'Workflow execution cancelled by user', 'error')
    }
  }

  pause() {
    this.isPaused = true
    if (this.activeNodeId) {
      this.log(this.activeNodeId, 'Pause requested. Execution will pause before the next node.', 'info')
    } else {
      this.window.webContents.send('workflow-log', {
        nodeId: 'system',
        message: 'Pause requested.',
        type: 'info',
        timestamp: new Date().toISOString()
      })
    }
  }

  resume() {
    this.isPaused = false
    this.proceedNext = false
    if (this.pausePromiseResolve) {
      this.pausePromiseResolve()
    }
  }

  proceed() {
    this.isPaused = false
    this.proceedNext = true
    if (this.pausePromiseResolve) {
      this.pausePromiseResolve()
    }
  }

  private async checkPause(nodeId: string, nodeIsPausedByBreakpoint: boolean) {
    if (nodeIsPausedByBreakpoint || this.isPaused) {
      this.isPaused = true
      this.pausedNodeId = nodeId
      this.updateStatus(nodeId, 'paused')
      this.log(nodeId, `Execution paused. Right-click node to resume (unpause) or proceed to next node.`, 'warn')

      await new Promise<void>((resolve) => {
        this.pausePromiseResolve = resolve
      })

      this.pausedNodeId = null
      this.pausePromiseResolve = null
    }
  }

  private log(nodeId: string, message: string, type: 'info' | 'error' | 'success' | 'warn' = 'info') {
    this.window.webContents.send('workflow-log', {
      nodeId,
      message,
      type,
      timestamp: new Date().toISOString()
    })
  }

  private updateStatus(nodeId: string, status: 'idle' | 'running' | 'success' | 'error' | 'paused', output?: any, error?: string) {
    this.window.webContents.send('workflow-status', {
      nodeId,
      status,
      output,
      error
    })
  }

  async execute(workflow: Workflow, credentials: Record<string, any>) {
    this.isCancelled = false
    this.activeNodeId = null

    const nodes = workflow.nodes
    const edges = workflow.edges

    // 1. Build adjacency lists and verify DAG
    const adjList: Record<string, string[]> = {}
    const inDegree: Record<string, number> = {}

    nodes.forEach(node => {
      adjList[node.id] = []
      inDegree[node.id] = 0
      // Initialize UI statuses to idle
      this.updateStatus(node.id, 'idle')
    })

    edges.forEach(edge => {
      if (adjList[edge.source]) {
        adjList[edge.source].push(edge.target)
      }
      if (inDegree[edge.target] !== undefined) {
        inDegree[edge.target]++
      }
    })

    // Find starting triggers (nodes of type 'trigger' or nodes with in-degree 0)
    const queue: string[] = []
    const triggers = nodes.filter(n => n.type === 'trigger')
    
    if (triggers.length > 0) {
      triggers.forEach(t => queue.push(t.id))
    } else {
      // Fallback: Add all nodes with in-degree 0
      nodes.forEach(node => {
        if (inDegree[node.id] === 0) {
          queue.push(node.id)
        }
      })
    }

    if (queue.length === 0 && nodes.length > 0) {
      this.window.webContents.send('workflow-log', {
        nodeId: 'system',
        message: 'No entry point (trigger or 0-indegree node) found in workflow.',
        type: 'error',
        timestamp: new Date().toISOString()
      })
      return { success: false, error: 'No entry point' }
    }

    const nodeOutputs: Record<string, any> = {}
    const executionContext: ExecutionContext = {
      nodeOutputs,
      credentials,
      log: (nodeId, message, type) => this.log(nodeId, message, type),
      onCancel: (callback) => {
        this.cancelCallbacks.add(callback)
        return () => this.cancelCallbacks.delete(callback)
      }
    }

    // Nodes currently waiting on dependencies
    const processedNodes = new Set<string>()

    this.window.webContents.send('workflow-log', {
      nodeId: 'system',
      message: 'Starting workflow execution...',
      type: 'info',
      timestamp: new Date().toISOString()
    })

    while (queue.length > 0) {
      if (this.isCancelled) {
        this.window.webContents.send('workflow-log', {
          nodeId: 'system',
          message: 'Workflow execution aborted.',
          type: 'error',
          timestamp: new Date().toISOString()
        })
        return { success: false, cancelled: true }
      }

      // Dequeue a node
      const currentId = queue.shift()!
      const currentNode = nodes.find(n => n.id === currentId)

      if (!currentNode) continue

      if (currentNode.data?.isDisabled === true) {
        this.log(currentId, `Node is paused (disabled). Skipping execution.`, 'info')
        this.updateStatus(currentId, 'success', { skipped: true })
        nodeOutputs[currentId] = { skipped: true }
        
        const cleanName = (currentNode.data.label || '').replace(/[^a-zA-Z0-9]/g, '')
        if (cleanName) {
          nodeOutputs[cleanName] = { skipped: true }
        }

        processedNodes.add(currentId)

        const neighbors = adjList[currentId]
        neighbors.forEach(neighborId => {
          inDegree[neighborId]--
          if (inDegree[neighborId] === 0 && !processedNodes.has(neighborId)) {
            queue.push(neighborId)
          }
        })
        continue
      }

      await this.checkPause(currentId, currentNode.data?.isPaused === true)

      if (this.isCancelled) {
        this.window.webContents.send('workflow-log', {
          nodeId: 'system',
          message: 'Workflow execution aborted.',
          type: 'error',
          timestamp: new Date().toISOString()
        })
        return { success: false, cancelled: true }
      }

      if (this.proceedNext) {
        this.proceedNext = false
        this.log(currentId, `Skipped executing node and proceeding to next`, 'info')
        this.updateStatus(currentId, 'success', {})
        nodeOutputs[currentId] = {}
        processedNodes.add(currentId)

        const neighbors = adjList[currentId]
        neighbors.forEach(neighborId => {
          inDegree[neighborId]--
          if (inDegree[neighborId] === 0 && !processedNodes.has(neighborId)) {
            queue.push(neighborId)
          }
        })
        continue
      }

      this.activeNodeId = currentId
      this.updateStatus(currentId, 'running')
      this.log(currentId, `Executing node: ${currentNode.data.label || currentNode.type}`, 'info')

      try {
        const executor = nodeExecutors[currentNode.type]
        if (!executor) {
          throw new Error(`Executor for node type "${currentNode.type}" not found.`)
        }

        // Run the node's task
        const output = await executor(currentNode, executionContext)
        
        nodeOutputs[currentNode.id] = output
        // Also map outputs by label/name for cleaner expression resolution in the UI, e.g. {{ Terminal.stdout }}
        const cleanName = (currentNode.data.label || '').replace(/[^a-zA-Z0-9]/g, '')
        if (cleanName) {
          nodeOutputs[cleanName] = output
        }

        this.updateStatus(currentId, 'success', output)
        processedNodes.add(currentId)

        // Queue downstream neighbors whose dependencies are fully resolved
        const neighbors = adjList[currentId]
        neighbors.forEach(neighborId => {
          inDegree[neighborId]--
          if (inDegree[neighborId] === 0 && !processedNodes.has(neighborId)) {
            queue.push(neighborId)
          }
        })
      } catch (err: any) {
        this.updateStatus(currentId, 'error', null, err.message)
        this.log(currentId, `Failed executing node: ${err.message}`, 'error')
        
        this.window.webContents.send('workflow-log', {
          nodeId: 'system',
          message: `Workflow halted due to error in node "${currentNode.data.label || currentNode.type}"`,
          type: 'error',
          timestamp: new Date().toISOString()
        })
        return { success: false, error: err.message }
      }
    }

    this.activeNodeId = null
    this.window.webContents.send('workflow-log', {
      nodeId: 'system',
      message: 'Workflow execution completed successfully.',
      type: 'success',
      timestamp: new Date().toISOString()
    })

    return { success: true, outputs: nodeOutputs }
  }
}
