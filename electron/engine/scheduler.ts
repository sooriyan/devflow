import cron, { ScheduledTask } from 'node-cron'
import fs from 'fs/promises'
import path from 'path'
import { BrowserWindow } from 'electron'
import { WorkflowExecutor } from './executor'

export interface WorkflowData {
  nodes?: Array<{ id: string; type: string; data: Record<string, unknown> }>
  edges?: Array<{ source: string; target: string }>
  schedule?: { enabled: boolean; cronExpression: string }
}

const activeCronJobs = new Map<string, ScheduledTask>()

let globalWorkflowsDir = ''
let globalGetMainWindow: () => BrowserWindow | null = () => null
let globalGetCredentials: () => Promise<Record<string, unknown>> = async () => ({})
let globalCheckBypass: () => boolean = () => false

export function initScheduler(
  workflowsDir: string,
  getMainWindow: () => BrowserWindow | null,
  getCredentials: () => Promise<Record<string, unknown>>,
  checkBypass: () => boolean
) {
  globalWorkflowsDir = workflowsDir
  globalGetMainWindow = getMainWindow
  globalGetCredentials = getCredentials
  globalCheckBypass = checkBypass
}

export function registerWorkflowSchedule(
  workflowName: string,
  cronExpression: string,
  workflowData: WorkflowData
) {
  // Clear any existing cron task for this workflow
  unregisterWorkflowSchedule(workflowName)

  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: "${cronExpression}"`)
  }

  const task = cron.schedule(cronExpression, async () => {
    console.log(`[DevFlow Cron] Triggering workflow "${workflowName}" scheduled run...`)
    try {
      const credentials = await globalGetCredentials()
      
      // Gating check: Pro is required for scheduled cron runs
      const isBypassed = globalCheckBypass()
      const isPro = credentials.isProActivated === true || isBypassed

      if (!isPro) {
        console.warn(`[DevFlow Cron] Skipping scheduled execution of "${workflowName}". Pro license required.`)
        return
      }

      const win = globalGetMainWindow()
      const executor = new WorkflowExecutor(win as BrowserWindow)
      
      // Clean up workflowData to only contain node/edge objects required by executor
      const executorData = {
        nodes: (workflowData.nodes || []).map((n) => ({ id: n.id, type: n.type, data: n.data })),
        edges: (workflowData.edges || []).map((e) => ({ source: e.source, target: e.target }))
      }

      const result = await executor.execute(executorData, credentials)
      console.log(`[DevFlow Cron] Scheduled run completed for "${workflowName}". Success: ${result.success}`)
    } catch (err: unknown) {
      console.error(`[DevFlow Cron] Error running scheduled workflow "${workflowName}":`, err)
    }
  })

  activeCronJobs.set(workflowName, task)
  console.log(`[DevFlow Cron] Scheduled task active for "${workflowName}": "${cronExpression}"`)
}

export function unregisterWorkflowSchedule(workflowName: string) {
  const task = activeCronJobs.get(workflowName)
  if (task) {
    task.stop()
    activeCronJobs.delete(workflowName)
    console.log(`[DevFlow Cron] Scheduled task stopped and removed for "${workflowName}"`)
  }
}

export async function loadAllSchedules() {
  try {
    const files = await fs.readdir(globalWorkflowsDir)
    let loadedCount = 0

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(globalWorkflowsDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const workflowData = JSON.parse(content) as WorkflowData
        const workflowName = path.basename(file, '.json')

        const schedule = workflowData.schedule
        if (schedule && schedule.enabled && schedule.cronExpression) {
          try {
            registerWorkflowSchedule(workflowName, schedule.cronExpression, workflowData)
            loadedCount++
          } catch (err: unknown) {
            console.error(`[DevFlow Cron] Failed to register startup schedule for "${workflowName}":`, (err as Error).message)
          }
        }
      }
    }
    console.log(`[DevFlow Cron] Initialized scheduler: loaded ${loadedCount} active cron job(s) from local workspace.`)
  } catch (err: unknown) {
    console.error('[DevFlow Cron] Failed to load workflows list for scheduler boot:', err)
  }
}
