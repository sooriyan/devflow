import { create } from 'zustand'
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import type {
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react'

export interface WorkflowNode extends Node {
  data: {
    label: string
    [key: string]: any
  }
}

interface LogEntry {
  nodeId: string
  message: string
  type: 'info' | 'error' | 'success' | 'warn'
  timestamp: string
}

interface NodeExecutionState {
  status: 'idle' | 'running' | 'success' | 'error' | 'paused'
  output?: any
  error?: string
}

interface WorkflowState {
  nodes: WorkflowNode[]
  edges: Edge[]
  selectedNodeId: string | null
  isRunning: boolean
  nodeStatuses: Record<string, NodeExecutionState>
  logs: LogEntry[]
  workflowsList: string[]
  currentWorkflowName: string
  
  // React Flow setters
  onNodesChange: OnNodesChange<WorkflowNode>
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: Edge[]) => void
  
  // Node management
  addNode: (type: string, x?: number, y?: number) => void
  removeNode: (id: string) => void
  updateNodeData: (id: string, data: Record<string, any>) => void
  selectNode: (id: string | null) => void
  clearCanvas: () => void

  // Execution actions
  runWorkflow: () => Promise<void>
  stopWorkflow: () => Promise<void>
  addLog: (log: LogEntry) => void
  updateNodeStatus: (nodeId: string, statusState: NodeExecutionState) => void

  // File management
  loadWorkflowsList: () => Promise<void>
  saveWorkflow: (name: string) => Promise<void>
  loadWorkflow: (name: string) => Promise<void>
  deleteWorkflow: (name: string) => Promise<void>
}

// Extends Window interface to support electronAPI
declare global {
  interface Window {
    electronAPI: {
      platform: string
      saveWorkflow: (name: string, data: any) => Promise<{ success: boolean }>
      loadWorkflow: (name: string) => Promise<any>
      listWorkflows: () => Promise<string[]>
      deleteWorkflow: (name: string) => Promise<{ success: boolean }>
      runWorkflow: (workflow: any) => Promise<any>
      stopWorkflow: () => Promise<any>
      pauseWorkflow: () => Promise<any>
      resumeWorkflow: () => Promise<any>
      proceedWorkflow: () => Promise<any>
      onWorkflowLog: (callback: (log: any) => void) => () => void
      onWorkflowStatus: (callback: (status: any) => void) => () => void
      saveCredentials: (credentials: any) => Promise<{ success: boolean; encrypted: boolean }>
      getCredentials: () => Promise<any>
      selectDirectory: () => Promise<string | null>
    }
  }
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isRunning: false,
  nodeStatuses: {},
  logs: [],
  workflowsList: [],
  currentWorkflowName: 'untitled-workflow',

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[],
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge({ ...connection, animated: true }, get().edges),
    })
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (type, x = 100, y = 100) => {
    const id = `${type}_${Date.now()}`
    
    // Default node configs
    let label = type.charAt(0).toUpperCase() + type.slice(1)
    let defaultData: Record<string, any> = {}

    if (type === 'trigger') {
      label = 'Manual Trigger'
    } else if (type === 'terminal') {
      defaultData = { command: 'echo "Hello World!"', cwd: '' }
    } else if (type === 'git') {
      defaultData = { operation: 'branch', branchName: '', commitMessage: '', commitHash: '', remote: 'origin', cwd: '' }
    } else if (type === 'github') {
      defaultData = { operation: 'create-pr', owner: '', repo: '', prTitle: '', headBranch: '', baseBranch: 'main', prBody: '', prNumber: '', commentBody: '' }
    } else if (type === 'jira') {
      defaultData = { operation: 'comment', issueKey: '', comment: '', transitionName: '' }
    } else if (type === 'mcp') {
      defaultData = { serverCmd: 'npx', serverArgs: '', toolName: '', toolArgs: '{}' }
    } else if (type === 'javascript') {
      label = 'Code Block'
      defaultData = { code: 'const data = inputs["Terminal_Node_ID"]?.stdout;\nconsole.log(data);\nreturn { data };' }
    }

    const newNode: WorkflowNode = {
      id,
      type,
      position: { x, y },
      data: { label, ...defaultData },
    }

    set({
      nodes: [...get().nodes, newNode],
      nodeStatuses: {
        ...get().nodeStatuses,
        [id]: { status: 'idle' },
      },
    })
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    })
    
    const statuses = { ...get().nodeStatuses }
    delete statuses[id]
    set({ nodeStatuses: statuses })
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } }
        }
        return node
      }),
    })
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  clearCanvas: () => set({ nodes: [], edges: [], selectedNodeId: null, nodeStatuses: {}, logs: [] }),

  runWorkflow: async () => {
    if (get().isRunning) return
    set({ isRunning: true, logs: [], nodeStatuses: {} })
    
    // Prepare Graph Data
    const workflowData = {
      nodes: get().nodes.map(n => ({ id: n.id, type: n.type, data: n.data })),
      edges: get().edges.map(e => ({ source: e.source, target: e.target }))
    }

    try {
      await window.electronAPI.runWorkflow(workflowData)
    } catch (err: any) {
      get().addLog({
        nodeId: 'system',
        message: `Execution failed to start: ${err.message}`,
        type: 'error',
        timestamp: new Date().toISOString()
      })
    } finally {
      set({ isRunning: false })
    }
  },

  stopWorkflow: async () => {
    if (!get().isRunning) return
    try {
      await window.electronAPI.stopWorkflow()
    } catch (err: any) {
      console.error('Failed to stop workflow:', err)
    }
  },

  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),

  updateNodeStatus: (nodeId, statusState) => {
    set((state) => ({
      nodeStatuses: {
        ...state.nodeStatuses,
        [nodeId]: {
          ...state.nodeStatuses[nodeId],
          ...statusState
        }
      }
    }))
  },

  loadWorkflowsList: async () => {
    try {
      const list = await window.electronAPI.listWorkflows()
      set({ workflowsList: list })
    } catch (err) {
      console.error('Failed listing workflows:', err)
    }
  },

  saveWorkflow: async (name) => {
    const data = {
      nodes: get().nodes,
      edges: get().edges,
      currentWorkflowName: name
    }
    try {
      await window.electronAPI.saveWorkflow(name, data)
      set({ currentWorkflowName: name })
      await get().loadWorkflowsList()
    } catch (err) {
      console.error('Failed saving workflow:', err)
    }
  },

  loadWorkflow: async (name) => {
    try {
      const data = await window.electronAPI.loadWorkflow(name)
      if (data) {
        set({
          nodes: data.nodes || [],
          edges: data.edges || [],
          currentWorkflowName: data.currentWorkflowName || name,
          selectedNodeId: null,
          nodeStatuses: {},
          logs: []
        })
      }
    } catch (err) {
      console.error('Failed loading workflow:', err)
    }
  },

  deleteWorkflow: async (name) => {
    try {
      await window.electronAPI.deleteWorkflow(name)
      if (get().currentWorkflowName === name) {
        get().clearCanvas()
        set({ currentWorkflowName: 'untitled-workflow' })
      }
      await get().loadWorkflowsList()
    } catch (err) {
      console.error('Failed deleting workflow:', err)
    }
  }
}))
