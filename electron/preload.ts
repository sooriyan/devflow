import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  // Workflow file actions
  saveWorkflow: (name: string, data: any) => ipcRenderer.invoke('save-workflow', name, data),
  loadWorkflow: (name: string) => ipcRenderer.invoke('load-workflow', name),
  listWorkflows: () => ipcRenderer.invoke('list-workflows'),
  deleteWorkflow: (name: string) => ipcRenderer.invoke('delete-workflow', name),

  // Execution actions
  runWorkflow: (workflow: any) => ipcRenderer.invoke('run-workflow', workflow),
  stopWorkflow: () => ipcRenderer.invoke('stop-workflow'),
  pauseWorkflow: () => ipcRenderer.invoke('pause-workflow'),
  resumeWorkflow: () => ipcRenderer.invoke('resume-workflow'),
  proceedWorkflow: () => ipcRenderer.invoke('proceed-workflow'),
  
  // Real-time logs and updates from main process
  onWorkflowLog: (callback: (log: any) => void) => {
    const subscription = (_event: any, log: any) => callback(log)
    ipcRenderer.on('workflow-log', subscription)
    return () => {
      ipcRenderer.removeListener('workflow-log', subscription)
    }
  },
  onWorkflowStatus: (callback: (status: any) => void) => {
    const subscription = (_event: any, status: any) => callback(status)
    ipcRenderer.on('workflow-status', subscription)
    return () => {
      ipcRenderer.removeListener('workflow-status', subscription)
    }
  },

  // Credentials actions
  saveCredentials: (credentials: any) => ipcRenderer.invoke('save-credentials', credentials),
  getCredentials: () => ipcRenderer.invoke('get-credentials'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  readDependencies: (dirPath: string) => ipcRenderer.invoke('read-dependencies', dirPath),

  // Pro & AI actions
  checkProStatus: () => ipcRenderer.invoke('check-pro-status'),
  activatePro: (licenseKey: string) => ipcRenderer.invoke('activate-pro', licenseKey),
  mockSubscribe: () => ipcRenderer.invoke('mock-subscribe'),
  generateWorkflow: (args: { provider: string; model: string; prompt: string }) => ipcRenderer.invoke('generate-workflow', args),
})
