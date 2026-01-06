import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface AIModel {
  id: string
  name: string
  contextLength: number
}

const MODELS: Record<string, AIModel[]> = {
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', contextLength: 32768 },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', contextLength: 32768 },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', contextLength: 32768 },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', contextLength: 32768 },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', contextLength: 128000 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextLength: 128000 },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextLength: 200000 },
    { id: 'claude-haiku-3-20250514', name: 'Claude Haiku 3', contextLength: 200000 },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', contextLength: 200000 },
  ],
  grok: [
    { id: 'grok-2', name: 'Grok 2', contextLength: 131072 },
    { id: 'grok-2-latest', name: 'Grok 2 Latest', contextLength: 131072 },
  ],
  minimax: [
    { id: 'abab6.5s-chat', name: 'MiniMax M2', contextLength: 24000 },
    { id: 'abab6.5-chat', name: 'MiniMax M1', contextLength: 24000 },
  ],
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')

  if (!provider) {
    return NextResponse.json({ error: 'Provider required' }, { status: 400 })
  }

  const models = MODELS[provider]
  if (!models) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  return NextResponse.json({ provider, models })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, model, messages, goal, apiKey, projectId } = body

    if (!provider || !model || !messages || !goal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const apiKeys: Record<string, string> = {
      groq: process.env.GROQ_API_KEY || apiKey || '',
      openai: process.env.OPENAI_API_KEY || apiKey || '',
      anthropic: process.env.ANTHROPIC_API_KEY || apiKey || '',
      grok: process.env.GROK_API_KEY || apiKey || '',
      minimax: process.env.MINIMAX_API_KEY || apiKey || '',
    }

    const apiUrl = getAPIUrl(provider)
    const headers = getHeaders(provider, apiKeys[provider])

    const systemPrompt = `You are an expert coding assistant. You help users write, debug, and improve code.
    
Project context: ${goal}

Please provide:
1. A brief summary of the changes you're proposing
2. File diffs in the following format:

\`\`\`diff
--- a/{filepath}
+++ b/{filepath}
@@ -1,3 +1,5 @@
- old line
+ new line
\`\`\`

Only output valid code and diffs. Be concise and helpful.`

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ]

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(buildRequestBody(provider, model, fullMessages)),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`AI API error (${provider}):`, error)
      return NextResponse.json({ error: `AI request failed: ${error}` }, { status: 500 })
    }

    const data = await response.json()
    const content = parseResponse(provider, data)

    return NextResponse.json({ content })
  } catch (error) {
    console.error('AI completion error:', error)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}

function getAPIUrl(provider: string): string {
  const urls: Record<string, string> = {
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    grok: 'https://api.x.ai/v1/chat/completions',
    minimax: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
  }
  return urls[provider] || urls.groq
}

function getHeaders(provider: string, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  switch (provider) {
    case 'groq':
    case 'openai':
      headers['Authorization'] = `Bearer ${apiKey}`
      break
    case 'anthropic':
      headers['x-api-key'] = apiKey
      headers['anthropic-version'] = '2023-06-01'
      break
    case 'grok':
      headers['Authorization'] = `Bearer ${apiKey}`
      break
    case 'minimax':
      headers['Authorization'] = `Bearer ${apiKey}`
      break
  }

  return headers
}

function buildRequestBody(provider: string, model: string, messages: any[]): Record<string, any> {
  switch (provider) {
    case 'anthropic':
      return {
        model,
        messages: messages.slice(1),
        max_tokens: 4096,
      }
    default:
      return {
        model,
        messages,
        max_tokens: 4096,
        temperature: 0.7,
      }
  }
}

function parseResponse(provider: string, data: any): string {
  switch (provider) {
    case 'anthropic':
      return data.content[0]?.text || ''
    default:
      return data.choices[0]?.message?.content || ''
  }
}

export function getAvailableProviders(): string[] {
  return Object.keys(MODELS)
}

export function getProviderModels(provider: string): AIModel[] {
  return MODELS[provider] || []
}
