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
  
  // Pro Subscription and AI status
  isPro: boolean
  isProBypassed: boolean
  isGeneratingAI: boolean
  aiError: string | null
  activeAiProvider: 'gemini' | 'openai' | 'anthropic' | 'deepseek'
  activeAiModel: string

  // Cron schedule status
  workflowSchedule: { enabled: boolean; cronExpression: string } | null
  setWorkflowSchedule: (schedule: { enabled: boolean; cronExpression: string } | null) => void

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

  // AI & Pro Actions
  checkProStatus: () => Promise<void>
  activateProWithKey: (key: string) => Promise<{ success: boolean; error?: string }>
  completeMockSubscription: () => Promise<void>
  setAiModel: (provider: 'gemini' | 'openai' | 'anthropic' | 'deepseek', model: string) => void
  generateWorkflowWithAI: (prompt: string, mode: 'replace' | 'append') => Promise<void>
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
      readDependencies: (dirPath: string) => Promise<{ dependencies: Record<string, string>; devDependencies: Record<string, string> }>
      
      // AI & Pro exposed channels
      checkProStatus: () => Promise<{ isPro: boolean; bypassed: boolean }>
      activatePro: (licenseKey: string) => Promise<{ success: boolean; error?: string }>
      mockSubscribe: () => Promise<{ success: boolean }>
      generateWorkflow: (args: { provider: string; model: string; prompt: string }) => Promise<unknown>
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
  
  // Pro Subscription and AI initial state
  isPro: false,
  isProBypassed: false,
  isGeneratingAI: false,
  aiError: null,
  activeAiProvider: 'gemini',
  activeAiModel: 'gemini-2.0-flash',

  // Cron schedule initial state
  workflowSchedule: null,
  setWorkflowSchedule: (schedule) => set({ workflowSchedule: schedule }),

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
      defaultData = { command: 'echo "Hello World!"', cwd: '', envVars: 'NODE_OPTIONS=--max-old-space-size=4096', showLogs: false }
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
    } else if (type === 'subworkflow') {
      label = 'Sub-Workflow'
      defaultData = { subWorkflowName: '' }
    } else if (type === 'dependency') {
      label = 'Manage Dependency'
      defaultData = { cwd: '', dependencyName: '', targetVersion: '' }
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

  clearCanvas: () => set({ nodes: [], edges: [], selectedNodeId: null, nodeStatuses: {}, logs: [], workflowSchedule: null }),

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

  addLog: (log) => set((state) => {
    const logsToAdd = Array.isArray(log) ? log : [log]
    const nextLogs = [...state.logs, ...logsToAdd]
    if (nextLogs.length > 1000) {
      return { logs: nextLogs.slice(nextLogs.length - 1000) }
    }
    return { logs: nextLogs }
  }),

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
      currentWorkflowName: name,
      schedule: get().workflowSchedule
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
          logs: [],
          workflowSchedule: data.schedule || null
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
  },

  checkProStatus: async () => {
    try {
      const status = await window.electronAPI.checkProStatus()
      set({ isPro: status.isPro, isProBypassed: status.bypassed })
    } catch (err) {
      console.error('Failed to check pro status:', err)
    }
  },

  activateProWithKey: async (key) => {
    try {
      const result = await window.electronAPI.activatePro(key)
      if (result.success) {
        await get().checkProStatus()
      }
      return result
    } catch (err: unknown) {
      console.error('Failed to activate pro with key:', err)
      return { success: false, error: (err as Error).message || 'Verification error' }
    }
  },

  completeMockSubscription: async () => {
    try {
      const result = await window.electronAPI.mockSubscribe()
      if (result.success) {
        await get().checkProStatus()
      }
    } catch (err) {
      console.error('Failed mock subscription:', err)
    }
  },

  setAiModel: (provider, model) => {
    set({ activeAiProvider: provider, activeAiModel: model })
  },

  generateWorkflowWithAI: async (prompt, mode) => {
    set({ isGeneratingAI: true, aiError: null })
    try {
      const args = {
        provider: get().activeAiProvider,
        model: get().activeAiModel,
        prompt
      }
      const response = (await window.electronAPI.generateWorkflow(args)) as {
        nodes: WorkflowNode[]
        edges: Edge[]
      }
      
      if (response && response.nodes && response.edges) {
        if (mode === 'replace') {
          set({
            nodes: response.nodes,
            edges: response.edges,
            selectedNodeId: null,
            nodeStatuses: {}
          })
          get().addLog({
            nodeId: 'system',
            message: `AI generated workflow replaced the canvas successfully using model ${get().activeAiModel}.`,
            type: 'success',
            timestamp: new Date().toISOString()
          })
        } else {
          // Append mode: offset the generated nodes so they don't cover existing ones.
          const currentNodes = get().nodes
          let offsetX = 0
          if (currentNodes.length > 0) {
            offsetX = Math.max(...currentNodes.map(n => n.position.x)) + 300
          }
          
          const uniqueId = `ai_${Date.now()}`
          const mappedNodes = response.nodes.map((n) => ({
            ...n,
            id: `${n.id}_${uniqueId}`,
            position: {
              x: n.position.x + offsetX,
              y: n.position.y
            }
          }))

          const mappedEdges = response.edges.map((e) => {
            const newSource = `${e.source}_${uniqueId}`
            const newTarget = `${e.target}_${uniqueId}`
            return {
              ...e,
              id: `e_${newSource}-${newTarget}`,
              source: newSource,
              target: newTarget
            }
          })

          set({
            nodes: [...currentNodes, ...mappedNodes],
            edges: [...get().edges, ...mappedEdges]
          })
          get().addLog({
            nodeId: 'system',
            message: `AI generated workflow appended to the canvas successfully using model ${get().activeAiModel}.`,
            type: 'success',
            timestamp: new Date().toISOString()
          })
        }
      } else {
        throw new Error('Invalid format returned from AI generation.')
      }
    } catch (err: unknown) {
      console.error('Failed generating workflow:', err)
      set({ aiError: (err as Error).message || 'An error occurred during generation.' })
      get().addLog({
        nodeId: 'system',
        message: `AI Workflow generation failed: ${(err as Error).message}`,
        type: 'error',
        timestamp: new Date().toISOString()
      })
    } finally {
      set({ isGeneratingAI: false })
    }
  }
}))
