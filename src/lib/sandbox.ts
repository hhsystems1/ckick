import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs/promises'

const PROJECT_DIR = '/tmp/ckick-projects'

interface Sandbox {
  projectId: string
  process: ChildProcess | null
  port: number | null
  createdAt: Date
  lastActivity: Date
}

const activeSandboxes = new Map<string, Sandbox>()

const DEV_SERVER_PORTS = [5173, 3000, 8000]

export async function createSandbox(projectId: string, files: Record<string, string>): Promise<Sandbox> {
  const existing = activeSandboxes.get(projectId)
  if (existing) {
    await terminateSandbox(projectId)
  }

  const projectDir = path.join(PROJECT_DIR, projectId)
  await fs.mkdir(projectDir, { recursive: true })

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(projectDir, filePath)
    const dir = path.dirname(fullPath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(fullPath, content)
  }

  const sandbox: Sandbox = {
    projectId,
    process: null,
    port: null,
    createdAt: new Date(),
    lastActivity: new Date(),
  }

  activeSandboxes.set(projectId, sandbox)
  return sandbox
}

export async function terminateSandbox(projectId: string): Promise<void> {
  const sandbox = activeSandboxes.get(projectId)
  if (sandbox) {
    if (sandbox.process) {
      sandbox.process.kill('SIGTERM')
    }
    activeSandboxes.delete(projectId)
  }
}

export async function executeCommand(
  projectId: string,
  command: string
): Promise<{ output: string; exitCode: number | null }> {
  const sandbox = activeSandboxes.get(projectId)
  if (!sandbox) {
    throw new Error('Sandbox not found')
  }

  sandbox.lastActivity = new Date()

  const projectDir = path.join(PROJECT_DIR, projectId)

  return new Promise((resolve) => {
    const proc = spawn('sh', ['-c', command], {
      cwd: projectDir,
      env: { ...process.env, HOME: '/tmp' },
    })

    let output = ''
    let errorOutput = ''

    proc.stdout.on('data', (data) => {
      output += data.toString()
    })

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    proc.on('close', (code) => {
      resolve({ output: output + errorOutput, exitCode: code })
    })

    proc.on('error', (err) => {
      resolve({ output: err.message, exitCode: 1 })
    })
  })
}

export async function installDependencies(projectId: string): Promise<{ success: boolean; output: string }> {
  const projectDir = path.join(PROJECT_DIR, projectId)
  const hasPackageJson = await fileExists(path.join(projectDir, 'package.json'))
  
  if (!hasPackageJson) {
    return { success: false, output: 'No package.json found' }
  }

  const result = await executeCommand(projectId, 'npm ci 2>&1')
  return {
    success: result.exitCode === 0,
    output: result.output,
  }
}

export async function startDevServer(projectId: string): Promise<number | null> {
  const projectDir = path.join(PROJECT_DIR, projectId)

  const sandbox = activeSandboxes.get(projectId)
  if (sandbox && sandbox.process) {
    sandbox.process.kill('SIGTERM')
  }

  return new Promise((resolve) => {
    const proc = spawn('npm', ['run', 'dev'], {
      cwd: projectDir,
      env: { ...process.env, HOME: '/tmp', PORT: '0' },
    })

    let output = ''
    let resolved = false

    const checkPort = async (port: number) => {
      try {
        const result = await executeCommand(projectId, `curl -s http://localhost:${port} > /dev/null 2>&1 && echo "running" || echo "not"`)
        if (result.output.includes('running')) {
          return port
        }
      } catch {
        return null
      }
      return null
    }

    proc.stdout.on('data', async (data) => {
      output += data.toString()
      if (!resolved) {
        for (const port of DEV_SERVER_PORTS) {
          const foundPort = await checkPort(port)
          if (foundPort !== null) {
            resolved = true
            if (sandbox) {
              sandbox.port = foundPort
              sandbox.process = proc
              sandbox.lastActivity = new Date()
            }
            resolve(foundPort)
            break
          }
        }
      }
    })

    proc.stderr.on('data', (data) => {
      output += data.toString()
    })

    proc.on('close', () => {
      if (!resolved) {
        resolved = true
        resolve(null)
      }
    })

    proc.on('error', () => {
      if (!resolved) {
        resolved = true
        resolve(null)
      }
    })

    setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve(null)
      }
    }, 15000)
  })
}

export async function buildProject(projectId: string): Promise<{ success: boolean; output: string }> {
  const result = await executeCommand(projectId, 'npm run build 2>&1')
  return {
    success: result.exitCode === 0,
    output: result.output,
  }
}

export async function detectPort(projectId: string): Promise<number | null> {
  for (const port of DEV_SERVER_PORTS) {
    const result = await executeCommand(projectId, `curl -s http://localhost:${port} > /dev/null 2>&1 && echo "running" || echo "not"`)
    if (result.output.includes('running')) {
      return port
    }
  }
  return null
}

export function getSandboxStatus(projectId: string): { active: boolean; port: number | null; lastActivity: Date | null } {
  const sandbox = activeSandboxes.get(projectId)
  return {
    active: !!sandbox,
    port: sandbox?.port || null,
    lastActivity: sandbox?.lastActivity || null,
  }
}

export function getAllSandboxes(): string[] {
  return Array.from(activeSandboxes.keys())
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
