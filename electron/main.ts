import { app, BrowserWindow, ipcMain, safeStorage, dialog, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { WorkflowExecutor } from './engine/executor'
import { generateWorkflow } from './engine/ai'
import {
  initScheduler,
  loadAllSchedules,
  registerWorkflowSchedule,
  unregisterWorkflowSchedule
} from './engine/scheduler'

// Set application name
app.name = 'DevFlow'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let activeExecutor: WorkflowExecutor | null = null

const WORKFLOWS_DIR = path.join(app.getPath('userData'), 'workflows')
const CREDENTIALS_FILE = path.join(app.getPath('userData'), 'credentials.enc')

// Ensure directories exist
if (!existsSync(WORKFLOWS_DIR)) {
  mkdirSync(WORKFLOWS_DIR, { recursive: true })
}

async function createWindow() {
  const iconPath = process.env.VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../public/icon.png')
    : path.join(__dirname, '../dist/icon.png')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'hidden', // Make it frameless and sleek
    titleBarOverlay: {
      color: '#09090b',
      symbolColor: '#f4f4f5',
      height: 35
    },
    backgroundColor: '#09090b',
  })

  // In production, load the built index.html. In dev, load Vite server.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function loadShellEnv() {
  if (process.platform === 'win32') {
    return
  }
  try {
    const shell = process.env.SHELL || '/bin/zsh'
    const stdout = execSync(`${shell} -l -c 'env'`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000
    })
    const lines = stdout.split('\n')
    for (const line of lines) {
      const parts = line.split('=')
      if (parts.length >= 2) {
        const key = parts[0]
        const value = parts.slice(1).join('=')
        if (key && key !== '_' && key !== 'PWD') {
          process.env[key] = value
        }
      }
    }
  } catch (err) {
    console.error('Failed to load shell environment:', err)
  }
}

app.whenReady().then(() => {
  loadShellEnv()

  // Set macOS dock icon dynamically during development
  if (app.dock) {
    try {
      const iconPath = process.env.VITE_DEV_SERVER_URL
        ? path.join(__dirname, '../public/icon.png')
        : path.join(__dirname, '../dist/icon.png')
      const image = nativeImage.createFromPath(iconPath)
      app.dock.setIcon(image)
    } catch (err) {
      console.error('Failed to set macOS dock icon:', err)
    }
  }

  createWindow()

  // Initialize scheduler and load active cron tasks
  initScheduler(
    WORKFLOWS_DIR,
    () => mainWindow,
    getCredentialsInternal,
    checkBypassStatus
  )
  loadAllSchedules()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC HANDLERS

ipcMain.handle('select-directory', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow || undefined
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory']
  })
  if (result.canceled) {
    return null
  } else {
    return result.filePaths[0]
  }
})

ipcMain.handle('read-dependencies', async (_, dirPath: string) => {
  if (!dirPath) {
    throw new Error('Directory path is required')
  }
  const pJsonPath = path.join(dirPath, 'package.json')
  try {
    const content = await fs.readFile(pJsonPath, 'utf-8')
    const pkg = JSON.parse(content)
    return {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {}
    }
  } catch (err: any) {
    throw new Error(`Failed to read package.json: ${err.message}`)
  }
})

// 1. Workflow file management
ipcMain.handle('save-workflow', async (_, name: string, data: any) => {
  const filePath = path.join(WORKFLOWS_DIR, `${name}.json`)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  
  // Register or unregister cron schedules dynamically
  const schedule = data.schedule
  if (schedule && schedule.enabled && schedule.cronExpression) {
    try {
      registerWorkflowSchedule(name, schedule.cronExpression, data)
    } catch (err: any) {
      console.error(`[DevFlow Cron] Failed to register schedule for "${name}":`, err.message)
    }
  } else {
    unregisterWorkflowSchedule(name)
  }

  return { success: true }
})

ipcMain.handle('load-workflow', async (_, name: string) => {
  const filePath = path.join(WORKFLOWS_DIR, `${name}.json`)
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
})

ipcMain.handle('list-workflows', async () => {
  const files = await fs.readdir(WORKFLOWS_DIR)
  const workflows = []
  for (const file of files) {
    if (file.endsWith('.json')) {
      workflows.push(path.basename(file, '.json'))
    }
  }
  return workflows
})

ipcMain.handle('delete-workflow', async (_, name: string) => {
  const filePath = path.join(WORKFLOWS_DIR, `${name}.json`)
  await fs.unlink(filePath)
  
  // Clean up cron schedules when workflow is deleted
  unregisterWorkflowSchedule(name)

  return { success: true }
})

// 2. Workflow Execution
ipcMain.handle('run-workflow', async (_, workflow: any) => {
  if (!mainWindow) return { success: false, error: 'No main window' }
  
  activeExecutor = new WorkflowExecutor(mainWindow)
  const credentials = await getCredentialsInternal()
  
  try {
    const result = await activeExecutor.execute(workflow, credentials)
    return result
  } catch (err: any) {
    return { success: false, error: err.message }
  } finally {
    activeExecutor = null
  }
})

ipcMain.handle('stop-workflow', async () => {
  if (activeExecutor) {
    activeExecutor.cancel()
    return { success: true }
  }
  return { success: false, error: 'No active workflow running' }
})

ipcMain.handle('pause-workflow', async () => {
  if (activeExecutor) {
    activeExecutor.pause()
    return { success: true }
  }
  return { success: false, error: 'No active workflow running' }
})

ipcMain.handle('resume-workflow', async () => {
  if (activeExecutor) {
    activeExecutor.resume()
    return { success: true }
  }
  return { success: false, error: 'No active workflow running' }
})

ipcMain.handle('proceed-workflow', async () => {
  if (activeExecutor) {
    activeExecutor.proceed()
    return { success: true }
  }
  return { success: false, error: 'No active workflow running' }
})

// 3. Credentials storage (Secure storage with safeStorage fallback)
async function getCredentialsInternal() {
  try {
    if (!existsSync(CREDENTIALS_FILE)) return {}
    const data = await fs.readFile(CREDENTIALS_FILE)
    if (safeStorage.isEncryptionAvailable()) {
      try {
        const decrypted = safeStorage.decryptString(data)
        return JSON.parse(decrypted)
      } catch {
        return JSON.parse(data.toString('utf-8'))
      }
    } else {
      return JSON.parse(data.toString('utf-8'))
    }
  } catch {
    return {}
  }
}

ipcMain.handle('get-credentials', async () => {
  return await getCredentialsInternal()
})

ipcMain.handle('save-credentials', async (_, credentials: any) => {
  const stringified = JSON.stringify(credentials)
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(stringified)
    await fs.writeFile(CREDENTIALS_FILE, encrypted)
    return { success: true, encrypted: true }
  } else {
    await fs.writeFile(CREDENTIALS_FILE, Buffer.from(stringified, 'utf-8'))
    return { success: true, encrypted: false }
  }
})

// 4. Pro feature gating and AI Generation IPC handlers
function checkBypassStatus(): boolean {
  const envBypass = process.env.DEVFLOW_BYPASS === 'true'
  const bypassFile = path.join(app.getPath('userData'), '.bypass')
  return envBypass || existsSync(bypassFile)
}

ipcMain.handle('check-pro-status', async () => {
  if (checkBypassStatus()) return { isPro: true, bypassed: true }
  const credentials = await getCredentialsInternal()
  return { isPro: credentials.isProActivated === true, bypassed: false }
})

ipcMain.handle('activate-pro', async (_, licenseKey: string) => {
  const trimmedKey = licenseKey.trim()
  const validKeys = ['DEVFLOW-BYPASS-ADMIN', 'FREE-PRO-ACCESS', 'DEVFLOW-100-INR-SIM']
  if (validKeys.includes(trimmedKey)) {
    const credentials = await getCredentialsInternal()
    credentials.isProActivated = true
    credentials.proActivationKey = trimmedKey
    
    const stringified = JSON.stringify(credentials)
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(stringified)
      await fs.writeFile(CREDENTIALS_FILE, encrypted)
    } else {
      await fs.writeFile(CREDENTIALS_FILE, Buffer.from(stringified, 'utf-8'))
    }
    return { success: true }
  }
  return { success: false, error: 'Invalid activation/bypass key' }
})

ipcMain.handle('mock-subscribe', async () => {
  const credentials = await getCredentialsInternal()
  credentials.isProActivated = true
  credentials.proActivationKey = 'MOCK_SUBSCRIPTION'
  
  const stringified = JSON.stringify(credentials)
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(stringified)
    await fs.writeFile(CREDENTIALS_FILE, encrypted)
  } else {
    await fs.writeFile(CREDENTIALS_FILE, Buffer.from(stringified, 'utf-8'))
  }
  return { success: true }
})

ipcMain.handle('generate-workflow', async (_, args: { provider: string; model: string; prompt: string }) => {
  const isBypassed = checkBypassStatus()
  const credentials = await getCredentialsInternal()
  const isPro = credentials.isProActivated === true || isBypassed

  if (!isPro) {
    throw new Error('DevFlow Pro is required to use the AI Assistant.')
  }

  const { provider, model, prompt } = args
  let apiKey = ''
  if (provider === 'gemini') apiKey = credentials.geminiApiKey
  else if (provider === 'openai') apiKey = credentials.openaiApiKey
  else if (provider === 'anthropic') apiKey = credentials.anthropicApiKey
  else if (provider === 'deepseek') apiKey = credentials.deepseekApiKey

  if (!apiKey) {
    throw new Error(`API key for ${provider} is missing. Please configure it in Settings.`)
  }

  return await generateWorkflow(provider, model, prompt, apiKey)
})
