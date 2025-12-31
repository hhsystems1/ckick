import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { computeDiff, type FileDiff } from '@/lib/diff'
import { validateRequestSize, validateAgentPayload, sanitizeGoal } from '@/lib/payload-limit'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { validateProjectOwnership, getUserBySession, createAuthErrorResponse } from '@/lib/auth'
import { events, captureException } from '@/lib/telemetry'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }
  
  return createClient(url, key)
}

async function getUserSettings(userId: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('userId', userId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

async function callLLM(provider: string, apiKey: string, prompt: string, context: string) {
  const providers: Record<string, { endpoint: string; model: string }> = {
    groq: {
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
    },
    claude: {
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-sonnet-4-20250514',
    },
    openai: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o',
    },
    minimax: {
      endpoint: 'https://api.minimax.io/v1/chat/completions',
      model: 'abab6.5s-chat',
    },
  }
  
  const config = providers[provider]
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`)
  }
  
  const maxContextLength = 60000
  const truncatedContext = context.length > maxContextLength 
    ? context.substring(0, maxContextLength) + '\n... [truncated]'
    : context

  const fullPrompt = `You are an AI coding assistant. Given the following task and context, provide the changes needed as a JSON response.

## Task
${prompt}

## Current Files Context
${truncatedContext}

## Response Format
Return a JSON object with this structure:
{
  "summary": "Brief description of changes",
  "files": [
    {
      "path": "path/to/file",
      "content": "complete new file content"
    }
  ]
}

Only include files that need to be modified. Provide the complete file content for each file, not just the diff. Keep your response concise and focused.`

  const startTime = Date.now()

  if (provider === 'claude') {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }
    
    const data = await response.json()
    const duration = Date.now() - startTime
    
    events.agentRequest({
      projectId: '',
      provider,
      success: true,
      duration,
      userId: '',
    })
    
    return data.content[0].text
  }
  
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 8192,
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`${provider.toUpperCase()} API error: ${error}`)
  }
  
  const data = await response.json()
  const duration = Date.now() - startTime
  
  events.agentRequest({
    projectId: '',
    provider,
    success: true,
    duration,
    userId: '',
  })
  
  return data.choices[0].message.content
}

function extractJSON(text: string): { summary: string; files: { path: string; content: string }[] } | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return null
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (parsed.summary && Array.isArray(parsed.files)) {
      return parsed
    }
  } catch {
    return null
  }
  
  return null
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const sizeCheck = validateRequestSize(request)
    if (!sizeCheck.valid) {
      return new Response(JSON.stringify({ error: sizeCheck.error }), { status: 413 })
    }

    const { userId, error: authError } = await getUserBySession(request)
    if (authError || !userId) {
      return createAuthErrorResponse(authError || 'Authentication required', 401)
    }

    const rateLimitResponse = await rateLimitMiddleware(request, userId, 'agent')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    
    const payloadValidation = validateAgentPayload(body)
    if (!payloadValidation.valid) {
      return new Response(JSON.stringify({ error: payloadValidation.error }), { status: 413 })
    }

    const { projectId, goal, context, provider: preferredProvider } = body
    
    if (!projectId || !goal) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, goal' },
        { status: 400 }
      )
    }

    const ownershipCheck = await validateProjectOwnership(projectId, userId)
    if (!ownershipCheck.valid) {
      return new Response(JSON.stringify({ error: ownershipCheck.error }), { status: ownershipCheck.status })
    }

    const sanitizedGoal = sanitizeGoal(goal)
    
    const supabase = getSupabase()
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const { data: files } = await getSupabase()
      .from('files')
      .select('*')
      .eq('projectId', projectId)
    
    const fileContext = files
      ?.map((f) => `## ${f.path}\n\`\`\`\n${f.content.slice(0, 5000)}\n\`\`\``)
      .join('\n\n') || ''
    
    let provider = preferredProvider || 'groq'
    let apiKey = ''
    
    const settings = await getUserSettings(userId)
    if (settings) {
      const providerKeys: Record<string, string | null> = {
        groq: settings.groqApiKey,
        claude: settings.claudeApiKey,
        openai: settings.openaiApiKey,
        minimax: settings.minimaxApiKey,
      }
      
      if (preferredProvider && providerKeys[preferredProvider]) {
        provider = preferredProvider
        apiKey = providerKeys[preferredProvider]!
      } else if (settings.preferredModel && providerKeys[settings.preferredModel]) {
        provider = settings.preferredModel
        apiKey = providerKeys[settings.preferredModel]!
      } else {
        for (const [p, key] of Object.entries(providerKeys)) {
          if (key) {
            provider = p
            apiKey = key
            break
          }
        }
      }
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key configured. Please set up your provider key in settings.' },
        { status: 401 }
      )
    }
    
    const llmResponse = await callLLM(provider, apiKey, sanitizedGoal, fileContext)
    
    const parsed = extractJSON(llmResponse)
    if (!parsed) {
      events.agentRequest({
        projectId,
        provider,
        success: false,
        duration: Date.now() - startTime,
        userId,
      })
      
      return NextResponse.json({
        summary: 'Failed to parse LLM response',
        files: [],
        rawResponse: llmResponse.substring(0, 500),
      })
    }
    
    const fileDiffs: FileDiff[] = []
    for (const file of parsed.files) {
      const existingFile = files?.find((f) => f.path === file.path)
      const originalContent = existingFile?.content || ''
      const diff = computeDiff(originalContent, file.content)
      
      fileDiffs.push({
        path: file.path,
        originalContent,
        newContent: file.content,
        diff,
      })
    }
    
    return NextResponse.json({
      summary: parsed.summary,
      files: fileDiffs,
      provider,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('POST /api/ai/agent:', error)
    captureException(error as Error, { 
      tags: { endpoint: 'ai/agent', method: 'POST' },
      extra: { duration },
    })
    
    events.agentRequest({
      projectId: '',
      provider: 'unknown',
      success: false,
      duration,
      userId: '',
    })
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Agent error' },
      { status: 500 }
    )
  }
}
