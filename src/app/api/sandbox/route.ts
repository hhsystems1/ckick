import { NextRequest, NextResponse } from 'next/server'
import { executeCommand, createSandbox, startDevServer, buildProject, installDependencies, getAllSandboxes } from '@/lib/sandbox'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'exec'

  try {
    const body = await request.json()
    const { projectId, command, files } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    switch (action) {
      case 'exec':
        if (!command) {
          return NextResponse.json({ error: 'Command required' }, { status: 400 })
        }
        const execResult = await executeCommand(projectId, command)
        return NextResponse.json(execResult)

      case 'create':
        if (!files) {
          return NextResponse.json({ error: 'Files required' }, { status: 400 })
        }
        await createSandbox(projectId, files)
        return NextResponse.json({ success: true })

      case 'install':
        const installResult = await installDependencies(projectId)
        return NextResponse.json(installResult)

      case 'dev':
        const port = await startDevServer(projectId)
        return NextResponse.json({ port })

      case 'build':
        const buildResult = await buildProject(projectId)
        return NextResponse.json(buildResult)

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Sandbox API error:', error)
    return NextResponse.json({ error: 'Sandbox operation failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const sandboxes = getAllSandboxes()
  return NextResponse.json({ sandboxes })
}
