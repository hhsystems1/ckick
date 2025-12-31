import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { validateRequestSize, sanitizeProjectName } from '@/lib/payload-limit'
import { rateLimitMiddleware, getIPAddress } from '@/lib/rate-limit'
import { getUserBySession, createAuthErrorResponse } from '@/lib/auth'
import { events, captureException } from '@/lib/telemetry'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const sizeCheck = validateRequestSize(request)
    if (!sizeCheck.valid) {
      return new Response(JSON.stringify({ error: sizeCheck.error }), { status: 413 })
    }

    const { userId, error: authError } = await getUserBySession(request)
    if (authError || !userId) {
      return createAuthErrorResponse(authError || 'Authentication required', 401)
    }

    const rateLimitResponse = await rateLimitMiddleware(request, userId, 'project')
    if (rateLimitResponse) return rateLimitResponse

    const { data, error } = await supabase
      .from('projects')
      .select('id, name, template, createdAt, updatedAt')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (error) throw error

    events.fileUpdated({ projectId: 'list', path: 'projects', userId })

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET /api/projects:', error)
    captureException(error as Error, { tags: { endpoint: 'projects', method: 'GET' } })
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sizeCheck = validateRequestSize(request)
    if (!sizeCheck.valid) {
      return new Response(JSON.stringify({ error: sizeCheck.error }), { status: 413 })
    }

    const { userId, error: authError } = await getUserBySession(request)
    if (authError || !userId) {
      return createAuthErrorResponse(authError || 'Authentication required', 401)
    }

    const rateLimitResponse = await rateLimitMiddleware(request, userId, 'project')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { name, template } = body

    if (!name || !template) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sanitizedName = sanitizeProjectName(name)
    if (!sanitizedName) {
      return NextResponse.json({ error: 'Invalid project name' }, { status: 400 })
    }

    const validTemplates = ['nextjs', 'node', 'python']
    if (!validTemplates.includes(template)) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{ userId, name: sanitizedName, template }])
      .select()
      .single()

    if (projectError) throw projectError

    const initialFiles = getTemplateFiles(template)
    const filesToInsert = initialFiles.map(f => ({
      projectId: project.id,
      name: f.name,
      path: f.path,
      content: f.content,
    }))

    const { error: filesError } = await supabase.from('files').insert(filesToInsert)

    if (filesError) {
      await supabase.from('projects').delete().eq('id', project.id)
      throw filesError
    }

    events.projectCreated({
      template,
      name: sanitizedName,
      userId,
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects:', error)
    captureException(error as Error, { tags: { endpoint: 'projects', method: 'POST' } })
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

function getTemplateFiles(template: string) {
  const rivrynJson = {
    name: 'rivryn.json',
    path: 'rivryn.json',
    content: JSON.stringify(
      {
        version: '1.0',
        tasks: {
          dev: { cmd: 'npm run dev', description: 'Start development server' },
          test: { cmd: 'npm run test', description: 'Run tests' },
          lint: { cmd: 'npm run lint', description: 'Run linter' },
          build: { cmd: 'npm run build', description: 'Build for production' },
          format: { cmd: 'npm run format', description: 'Format code' },
        },
      },
      null,
      2
    ),
  }

  if (template === 'nextjs') {
    return [
      {
        name: 'package.json',
        path: 'package.json',
        content: JSON.stringify(
          {
            name: 'rivryn-nextjs',
            version: '0.1.0',
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start',
              lint: 'eslint .',
              test: 'vitest',
              format: 'prettier --write .',
            },
            dependencies: {
              next: '^14.0.0',
              react: '^18.0.0',
              'react-dom': '^18.0.0',
            },
          },
          null,
          2
        ),
      },
      {
        name: 'app.tsx',
        path: 'src/app.tsx',
        content: `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">Welcome to Rivryn</h1>
        <p className="text-xl text-slate-300">Start building with your project</p>
      </div>
    </div>
  )
}`,
      },
      rivrynJson,
    ]
  }

  if (template === 'node') {
    return [
      {
        name: 'package.json',
        path: 'package.json',
        content: JSON.stringify(
          {
            name: 'rivryn-node',
            version: '0.1.0',
            main: 'src/index.ts',
            scripts: {
              dev: 'ts-node src/index.ts',
              build: 'tsc',
              start: 'node dist/index.js',
              test: 'vitest',
              lint: 'eslint src',
              format: 'prettier --write src',
            },
            dependencies: {},
            devDependencies: {
              typescript: '^5.0.0',
              'ts-node': '^10.0.0',
              vitest: '^0.34.0',
            },
          },
          null,
          2
        ),
      },
      {
        name: 'index.ts',
        path: 'src/index.ts',
        content: `console.log('Hello from Rivryn Node project!');

// Start building your application here
const greeting = (name: string): string => {
  return \`Welcome, \${name}!\`;
};

console.log(greeting('Developer'));`,
      },
      rivrynJson,
    ]
  }

  if (template === 'python') {
    return [
      {
        name: 'requirements.txt',
        path: 'requirements.txt',
        content: `pytest==7.4.0`,
      },
      {
        name: 'main.py',
        path: 'main.py',
        content: `def greet(name: str) -> str:
    """Greet a person by name."""
    return f"Hello, {name}!"

if __name__ == "__main__":
    print("Welcome to Rivryn Python project!")
    print(greet("Developer"))`,
      },
      {
        name: 'test_main.py',
        path: 'test_main.py',
        content: `from main import greet

def test_greet():
    """Test the greet function."""
    assert greet("World") == "Hello, World!"`,
      },
      {
        name: 'rivryn.json',
        path: 'rivryn.json',
        content: JSON.stringify(
          {
            version: '1.0',
            tasks: {
              dev: { cmd: 'python main.py', description: 'Run main script' },
              test: { cmd: 'pytest', description: 'Run tests' },
              lint: { cmd: 'pylint main.py', description: 'Run linter' },
              build: { cmd: 'echo "No build needed"', description: 'Placeholder build' },
              format: { cmd: 'black main.py', description: 'Format code' },
            },
          },
          null,
          2
        ),
      },
    ]
  }

  return [rivrynJson]
}
