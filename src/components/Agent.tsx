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
}

interface ProviderKeys {
  groqApiKey: string
  claudeApiKey: string
  openaiApiKey: string
  minimaxApiKey: string
  preferredModel: string
}

export function Agent({ projectId, userId, onFileChange }: AgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedDiff, setSelectedDiff] = useState<FileDiff | null>(null)
  const [appliedDiffs, setAppliedDiffs] = useState<Set<string>>(new Set())
  const [showProviderSettings, setShowProviderSettings] = useState(false)
  const [providerKeys, setProviderKeys] = useState<ProviderKeys>({
    groqApiKey: '',
    claudeApiKey: '',
    openaiApiKey: '',
    minimaxApiKey: '',
    preferredModel: 'groq',
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const supabase = getSupabaseClient()

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings?userId=${userId}`)
      const data = await res.json()
      setProviderKeys({
        groqApiKey: data.groqApiKey || '',
        claudeApiKey: data.claudeApiKey || '',
        openaiApiKey: data.openaiApiKey || '',
        minimaxApiKey: data.minimaxApiKey || '',
        preferredModel: data.preferredModel || 'groq',
      })
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
          minimaxApiKey: providerKeys.minimaxApiKey || null,
          preferredModel: providerKeys.preferredModel,
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

    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId,
          goal: userMessage,
        }),
      })

      const data = await res.json()

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
        .select('id, projectId, path, content, updatedAt')
        .eq('projectId', projectId)
        .eq('path', fileDiff.path)
        .single()
      const fileData = (fileDataResult as any).data

      if (fileData) {
        // @ts-expect-error - Supabase RLS types restrict updates for anon key
        await supabase.from('files').update({ 
          content: fileDiff.newContent, 
          updatedAt: new Date().toISOString() 
        }).eq('id', fileData.id)
      } else {
        // @ts-expect-error - Supabase RLS types restrict inserts for anon key
        await supabase.from('files').insert([{
          projectId,
          path: fileDiff.path,
          name: fileDiff.path.split('/').pop() || fileDiff.path,
          content: fileDiff.newContent,
        }])
      }

      // @ts-expect-error - Supabase RLS types restrict inserts for anon key
      await supabase.from('agent_changes').insert([{
        userId,
        projectId,
        filePath: fileDiff.path,
        originalContent: fileDiff.originalContent,
        newContent: fileDiff.newContent,
        diff: fileDiff.diff,
        summary: messages[messages.length - 1]?.content || '',
        applied: true,
        appliedAt: new Date().toISOString(),
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
        const db = supabase as any
        await db.from('files').update({ 
          content: lastChange.original_content, 
          updated_at: new Date().toISOString() 
        }).eq('id', fileData.id)
      }

      const db = supabase as any
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
    <div className="h-full flex flex-col bg-bg">
      <div className="bg-surface border-b border-borderSoft px-4 py-3 flex items-center justify-between">
        <h2 className="font-semibold text-textPrimary">AI Agent</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={undoLastChange}
            className="p-2 hover:bg-surfaceSoft rounded transition"
            title="Undo last change"
          >
            <RotateCcw size={18} className="text-textSecondary" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-surfaceSoft rounded transition"
            title="Settings"
          >
            <Settings size={18} className="text-textSecondary" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-surface border-b border-borderSoft p-4">
          <button
            onClick={() => setShowProviderSettings(!showProviderSettings)}
            className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary"
          >
            {showProviderSettings ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Provider Keys
          </button>
          
          {showProviderSettings && (
            <div className="mt-4 space-y-3 pl-6">
              <div>
                <label className="block text-xs text-textMuted mb-1">Groq API Key</label>
                <input
                  type="password"
                  value={providerKeys.groqApiKey}
                  onChange={(e) => setProviderKeys({ ...providerKeys, groqApiKey: e.target.value })}
                  className="w-full bg-surfaceSoft border border-borderSoft rounded px-3 py-2 text-sm text-textPrimary"
                  placeholder="gsk_..."
                />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1">Claude API Key</label>
                <input
                  type="password"
                  value={providerKeys.claudeApiKey}
                  onChange={(e) => setProviderKeys({ ...providerKeys, claudeApiKey: e.target.value })}
                  className="w-full bg-surfaceSoft border border-borderSoft rounded px-3 py-2 text-sm text-textPrimary"
                  placeholder="sk-ant-api..."
                />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={providerKeys.openaiApiKey}
                  onChange={(e) => setProviderKeys({ ...providerKeys, openaiApiKey: e.target.value })}
                  className="w-full bg-surfaceSoft border border-borderSoft rounded px-3 py-2 text-sm text-textPrimary"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1">MiniMax API Key</label>
                <input
                  type="password"
                  value={providerKeys.minimaxApiKey}
                  onChange={(e) => setProviderKeys({ ...providerKeys, minimaxApiKey: e.target.value })}
                  className="w-full bg-surfaceSoft border border-borderSoft rounded px-3 py-2 text-sm text-textPrimary"
                  placeholder="..."
                />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1">Preferred Provider</label>
                <select
                  value={providerKeys.preferredModel}
                  onChange={(e) => setProviderKeys({ ...providerKeys, preferredModel: e.target.value })}
                  className="w-full bg-surfaceSoft border border-borderSoft rounded px-3 py-2 text-sm text-textPrimary"
                >
                  <option value="groq">Groq</option>
                  <option value="claude">Claude</option>
                  <option value="openai">OpenAI</option>
                  <option value="minimax">MiniMax</option>
                </select>
              </div>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-accent text-white rounded text-sm hover:opacity-90"
              >
                Save Settings
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-textMuted py-8">
            <FileDiff size={48} className="mx-auto mb-4 opacity-50" />
            <p>Describe what you want to build or change.</p>
            <p className="text-sm mt-2">The AI agent will propose changes for you to review.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-borderSoft'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              
              {message.diffs && message.diffs.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-textMuted uppercase">Proposed Changes</p>
                  {message.diffs.map((diff, diffIndex) => (
                    <div key={diffIndex} className="border border-borderSoft rounded overflow-hidden">
                      <div className="bg-surfaceSoft px-3 py-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-textPrimary">{diff.path}</span>
                        <div className="flex items-center gap-1">
                          {appliedDiffs.has(diff.path) ? (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <Check size={14} /> Applied
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => applyDiff(diff)}
                                className="p-1 hover:bg-green-500/20 rounded text-green-400"
                                title="Apply"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => discardDiff(diff)}
                                className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                title="Discard"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedDiff(selectedDiff?.path === diff.path ? null : diff)}
                        className="w-full px-3 py-2 text-xs text-textMuted hover:bg-surfaceSoft text-left"
                      >
                        {selectedDiff?.path === diff.path ? 'Hide diff' : 'Show diff'}
                      </button>
                      {selectedDiff?.path === diff.path && (
                        <div className="bg-bg font-mono text-xs overflow-auto max-h-64">
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
            <div className="bg-surface border border-borderSoft rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-textMuted" />
              <span className="text-sm text-textMuted">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-borderSoft p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your changes..."
            className="flex-1 bg-surfaceSoft border border-borderSoft rounded-lg px-4 py-2 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
