'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/typed-client'
import { Send, Check, X, RotateCcw, Settings, Loader2, FileDiff, ChevronDown, ChevronRight } from 'lucide-react'
import type { File, AgentChange } from '@/types/supabase'

interface FileDiff {
  path: string
  originalContent: string
  newContent: string
  diff: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  diffs?: FileDiff[]
  timestamp: Date
}

interface AgentProps {
  projectId: string
  userId: string
  onFileChange: () => void
  onApplyPatch?: (path: string, content: string) => Promise<void>
}

interface ProviderKeys {
  groqApiKey: string
  claudeApiKey: string
  openaiApiKey: string
  grokApiKey: string
  minimaxApiKey: string
  preferredProvider: string
  preferredModel: string
}

const PROVIDERS = [
  { id: 'groq', name: 'Groq (FREE)', icon: '🚀', description: 'Fast inference with Llama models' },
  { id: 'anthropic', name: 'Claude', icon: '🧠', description: 'Anthropic\'s advanced reasoning' },
  { id: 'openai', name: 'OpenAI', icon: '🔮', description: 'GPT-4 and GPT-4o models' },
  { id: 'grok', name: 'Grok', icon: '⚡', description: 'xAI\'s Grok models' },
  { id: 'minimax', name: 'MiniMax', icon: '💎', description: 'Fast M2 model (limited free tier)' },
]

const MODELS: Record<string, Array<{ id: string; name: string }>> = {
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    { id: 'claude-haiku-3-20250514', name: 'Claude Haiku 3' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  ],
  grok: [
    { id: 'grok-2', name: 'Grok 2' },
    { id: 'grok-2-latest', name: 'Grok 2 Latest' },
  ],
  minimax: [
    { id: 'abab6.5s-chat', name: 'MiniMax M2' },
    { id: 'abab6.5-chat', name: 'MiniMax M1' },
  ],
}

export function Agent({ projectId, userId, onFileChange, onApplyPatch }: AgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedDiff, setSelectedDiff] = useState<FileDiff | null>(null)
  const [appliedDiffs, setAppliedDiffs] = useState<Set<string>>(new Set())
  const [showProviderSettings, setShowProviderSettings] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('groq')
  const [selectedModel, setSelectedModel] = useState('')
  const [providerKeys, setProviderKeys] = useState<ProviderKeys>({
    groqApiKey: '',
    claudeApiKey: '',
    openaiApiKey: '',
    grokApiKey: '',
    minimaxApiKey: '',
    preferredProvider: 'groq',
    preferredModel: '',
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const supabase = getSupabaseClient()

  useEffect(() => {
    const defaultModel = MODELS[selectedProvider]?.[0]?.id || ''
    setSelectedModel(defaultModel)
  }, [selectedProvider])

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings?userId=${userId}`)
      const data = await res.json()
      setProviderKeys({
        groqApiKey: data.groqApiKey || '',
        claudeApiKey: data.claudeApiKey || '',
        openaiApiKey: data.openaiApiKey || '',
        grokApiKey: data.grokApiKey || '',
        minimaxApiKey: data.minimaxApiKey || '',
        preferredProvider: data.preferredProvider || 'groq',
        preferredModel: data.preferredModel || '',
      })
      if (data.preferredProvider) {
        setSelectedProvider(data.preferredProvider)
        setSelectedModel(data.preferredModel || MODELS[data.preferredProvider]?.[0]?.id || '')
      }
    } catch {
      console.error('Failed to load settings')
    }
  }, [userId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function getApiKeyForProvider(provider: string): string {
    switch (provider) {
      case 'groq': return providerKeys.groqApiKey
      case 'anthropic': return providerKeys.claudeApiKey
      case 'openai': return providerKeys.openaiApiKey
      case 'grok': return providerKeys.grokApiKey
      case 'minimax': return providerKeys.minimaxApiKey
      default: return ''
    }
  }

  async function saveSettings() {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          groqApiKey: providerKeys.groqApiKey || null,
          claudeApiKey: providerKeys.claudeApiKey || null,
          openaiApiKey: providerKeys.openaiApiKey || null,
          grokApiKey: providerKeys.grokApiKey || null,
          minimaxApiKey: providerKeys.minimaxApiKey || null,
          preferredProvider: selectedProvider,
          preferredModel: selectedModel,
        }),
      })
      setShowProviderSettings(false)
    } catch {
      console.error('Failed to save settings')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date() },
    ])

    const apiKey = getApiKeyForProvider(selectedProvider)

    try {
      const res = await fetch('/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          messages: messages,
          goal: userMessage,
          apiKey,
          projectId,
        }),
      })

      interface AiResponse {
        error?: string
        summary?: string
        files?: FileDiff[]
      }

      const data: AiResponse = await res.json()

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error || 'Failed to process request',
            timestamp: new Date(),
          },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.summary || 'Changes proposed.',
          diffs: data.files,
          timestamp: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while processing your request.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function applyDiff(fileDiff: FileDiff) {
    try {
      const fileDataResult = await supabase
        .from('files')
        .select('id, project_id, path, content, updated_at')
        .eq('project_id', projectId)
        .eq('path', fileDiff.path)
        .single()

      interface FileRecord {
        id: string
        project_id: string
        path: string
        content: string
        updated_at: string
      }

      const fileData: FileRecord | null = fileDataResult.data as FileRecord | null

      if (fileData) {
        // @ts-expect-error - Supabase RLS types restrict updates for anon key
        await supabase.from('files').update({ 
          content: fileDiff.newContent, 
          updated_at: new Date().toISOString() 
        }).eq('id', fileData.id)
      } else {
        // @ts-expect-error - Supabase RLS types restrict inserts for anon key
        await supabase.from('files').insert([{
          project_id: projectId,
          path: fileDiff.path,
          name: fileDiff.path.split('/').pop() || fileDiff.path,
          content: fileDiff.newContent,
        }])
      }

      if (onApplyPatch) {
        await onApplyPatch(fileDiff.path, fileDiff.newContent)
      }

      // @ts-expect-error - Supabase RLS types restrict inserts for anon key
      await supabase.from('agent_changes').insert([{
        user_id: userId,
        project_id: projectId,
        file_path: fileDiff.path,
        original_content: fileDiff.originalContent,
        new_content: fileDiff.newContent,
        diff: fileDiff.diff,
        summary: messages[messages.length - 1]?.content || '',
        applied: true,
        applied_at: new Date().toISOString(),
      }])

      setAppliedDiffs((prev) => new Set(prev).add(fileDiff.path))
      onFileChange()
    } catch {
      console.error('Failed to apply diff')
    }
  }

  async function discardDiff(fileDiff: FileDiff) {
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1]
      if (lastMessage?.diffs) {
        lastMessage.diffs = lastMessage.diffs.filter((d) => d.path !== fileDiff.path)
      }
      return [...prev]
    })
  }

  async function undoLastChange() {
    try {
      const { data: lastChange } = await supabase
        .from('agent_changes')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('applied', true)
        .eq('undone', false)
        .order('applied_at', { ascending: false })
        .limit(1)
        .single() as { data: AgentChange | null }

      if (!lastChange) {
        return
      }

      const { data: fileData } = await supabase
        .from('files')
        .select('id')
        .eq('project_id', projectId)
        .eq('path', lastChange.file_path)
        .single() as { data: { id: string } | null }

      if (fileData) {
        const db = supabase as unknown as { from(table: string): { update(data: Record<string, unknown>): { eq(column: string, value: string): Promise<{ error: Error | null }> } } }
        await db.from('files').update({ 
          content: lastChange.original_content, 
          updated_at: new Date().toISOString() 
        }).eq('id', fileData.id)
      }

      const db = supabase as unknown as { from(table: string): { update(data: Record<string, unknown>): { eq(column: string, value: string): Promise<{ error: Error | null }> } } }
      await db.from('agent_changes').update({ 
        undone: true, 
        undone_at: new Date().toISOString() 
      }).eq('id', lastChange.id)

      onFileChange()
    } catch {
      console.error('Failed to undo')
    }
  }

  function renderDiffLine(line: string, index: number) {
    if (line.startsWith('+ ')) {
      return (
        <div key={index} className="bg-green-500/10 px-2">
          <span className="text-green-400">+{line.substring(1)}</span>
        </div>
      )
    } else if (line.startsWith('- ')) {
      return (
        <div key={index} className="bg-red-500/10 px-2">
          <span className="text-red-400">-{line.substring(1)}</span>
        </div>
      )
    } else {
      return (
        <div key={index} className="px-2 text-textMuted">
          {line.substring(1)}
        </div>
      )
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#0F1419]">
      <div className="bg-[#1E2937] border-b border-[#4FB6A1]/20 px-4 py-3 flex items-center justify-between">
        <h2 className="font-semibold text-[#F5F7F6]">AI Agent</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={undoLastChange}
            className="p-2 hover:bg-[#F5F7F6]/10 rounded-lg transition active:scale-95"
            title="Undo last change"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <RotateCcw size={18} className="text-[#F5F7F6]/60" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-[#F5F7F6]/10 rounded-lg transition active:scale-95"
            title="Settings"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Settings size={18} className="text-[#F5F7F6]/60" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-[#1E2937] border-b border-[#4FB6A1]/20 p-4">
          <button
            onClick={() => setShowProviderSettings(!showProviderSettings)}
            className="flex items-center gap-2 text-sm text-[#F5F7F6]/60 hover:text-[#F5F7F6]"
          >
            {showProviderSettings ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Provider Keys
          </button>
          
          {showProviderSettings && (
            <div className="mt-4 space-y-3 pl-6">
              <div>
                <label className="block text-xs text-[#F5F7F6]/40 mb-1">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full bg-[#0F1419] border border-[#4FB6A1]/30 rounded-lg px-3 py-2.5 text-sm text-[#F5F7F6]"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#F5F7F6]/40 mb-1">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#0F1419] border border-[#4FB6A1]/30 rounded-lg px-3 py-2.5 text-sm text-[#F5F7F6]"
                >
                  {MODELS[selectedProvider]?.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#F5F7F6]/40 mb-1">Groq API Key (FREE)</label>
                <input
                  type="password"
                  value={providerKeys.groqApiKey}
                  onChange={(e) => setProviderKeys({ ...providerKeys, groqApiKey: e.target.value })}
                  className="w-full bg-[#0F1419] border border-[#4FB6A1]/30 rounded-lg px-3 py-2.5 text-sm text-[#F5F7F6]"
                  placeholder="gsk_..."
                />
              </div>
              <div>
                <label className="block text-xs text-[#F5F7F6]/40 mb-1">Claude API Key</label>
                <input
                  type="password"
                  value={providerKeys.claudeApiKey}
                  onChange={(e) => setProviderKeys({ ...providerKeys, claudeApiKey: e.target.value })}
                  className="w-full bg-[#0F1419] border border-[#4FB6A1]/30 rounded-lg px-3 py-2.5 text-sm text-[#F5F7F6]"
                  placeholder="sk-ant-api..."
                />
              </div>
              <div>
                <label className="block text-xs text-[#F5F7F6]/40 mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={providerKeys.openaiApiKey}
                  onChange={(e) => setProviderKeys({ ...providerKeys, openaiApiKey: e.target.value })}
                  className="w-full bg-[#0F1419] border border-[#4FB6A1]/30 rounded-lg px-3 py-2.5 text-sm text-[#F5F7F6]"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-xs text-[#F5F7F6]/40 mb-1">Grok API Key</label>
                <input
                  type="password"
                  value={providerKeys.grokApiKey}
                  onChange={(e) => setProviderKeys({ ...providerKeys, grokApiKey: e.target.value })}
                  className="w-full bg-[#0F1419] border border-[#4FB6A1]/30 rounded-lg px-3 py-2.5 text-sm text-[#F5F7F6]"
                  placeholder="xai-..."
                />
              </div>
              <div>
                <label className="block text-xs text-[#F5F7F6]/40 mb-1">MiniMax API Key</label>
                <input
                  type="password"
                  value={providerKeys.minimaxApiKey}
                  onChange={(e) => setProviderKeys({ ...providerKeys, minimaxApiKey: e.target.value })}
                  className="w-full bg-[#0F1419] border border-[#4FB6A1]/30 rounded-lg px-3 py-2.5 text-sm text-[#F5F7F6]"
                  placeholder="mm_..."
                />
              </div>
              <button
                onClick={saveSettings}
                className="px-4 py-2.5 bg-[#4FB6A1] text-[#0F1419] rounded-lg text-sm font-medium hover:opacity-90 active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                Save Settings
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[#F5F7F6]/40 py-8">
            <FileDiff size={48} className="mx-auto mb-4 opacity-50" />
            <p>Describe what you want to build or change.</p>
            <p className="text-sm mt-2">The AI agent will propose changes for you to review.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-[#4FB6A1] text-[#0F1419]'
                  : 'bg-[#1E2937] border border-[#4FB6A1]/20'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              
              {message.diffs && message.diffs.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-[#F5F7F6]/40 uppercase">Proposed Changes</p>
                  {message.diffs.map((diff, diffIndex) => (
                    <div key={diffIndex} className="border border-[#4FB6A1]/20 rounded-lg overflow-hidden">
                      <div className="bg-[#0F1419] px-3 py-2.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#F5F7F6]">{diff.path}</span>
                        <div className="flex items-center gap-1">
                          {appliedDiffs.has(diff.path) ? (
                            <span className="text-xs text-[#6FAE7A] flex items-center gap-1">
                              <Check size={14} /> Applied
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => applyDiff(diff)}
                                className="p-1.5 hover:bg-[#6FAE7A]/20 rounded-lg text-[#6FAE7A] transition active:scale-95"
                                title="Apply"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => discardDiff(diff)}
                                className="p-1.5 hover:bg-[#C97A4A]/20 rounded-lg text-[#C97A4A] transition active:scale-95"
                                title="Discard"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedDiff(selectedDiff?.path === diff.path ? null : diff)}
                        className="w-full px-3 py-2 text-xs text-[#F5F7F6]/40 hover:bg-[#1E2937] text-left"
                      >
                        {selectedDiff?.path === diff.path ? 'Hide diff' : 'Show diff'}
                      </button>
                      {selectedDiff?.path === diff.path && (
                        <div className="bg-[#0F1419] font-mono text-xs overflow-auto max-h-48">
                          {diff.diff.split('\n').map((line, i) => renderDiffLine(line, i))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1E2937] border border-[#4FB6A1]/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#4FB6A1]" />
              <span className="text-sm text-[#F5F7F6]/60">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[#4FB6A1]/20 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your changes..."
            className="flex-1 bg-[#1E2937] border border-[#4FB6A1]/30 rounded-xl px-4 py-2.5 text-sm text-[#F5F7F6] placeholder-[#F5F7F6]/30 focus:outline-none focus:border-[#4FB6A1]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-[#4FB6A1] text-[#0F1419] rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}
