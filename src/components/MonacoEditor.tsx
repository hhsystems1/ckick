'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Keyboard, Save } from 'lucide-react'

interface MonacoEditorProps {
  initialContent: string
  fileName: string
  onSave: (content: string) => Promise<void>
  onChange?: (content: string) => void
  theme?: 'vs-dark' | 'light'
}

export function MonacoEditor({
  initialContent,
  fileName,
  onSave,
  onChange,
  theme = 'vs-dark',
}: MonacoEditorProps) {
  const editorRef = useRef<any>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showStartButton, setShowStartButton] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    // Detect if device is mobile
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
      setIsMobile(mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Hide start button once editor is mounted and user starts interacting
    editor.onDidFocusEditorText(() => {
      setShowStartButton(false)
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      const content = editor.getValue()
      setSaveStatus('saving')
      await onSave(content)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    })

    editor.onDidChangeModelContent(() => {
      const content = editor.getValue()
      onChange?.(content)
      setShowStartButton(false)

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      setSaveStatus('saving')
      saveTimeoutRef.current = setTimeout(async () => {
        await onSave(content)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 1000)
    })

    monaco.editor.defineTheme('rivryn', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#0E1110',
        'editor.foreground': '#F4F6F5',
        'editor.lineHighlightBackground': 'rgba(79, 182, 161, 0.05)',
        'editor.selectionBackground': 'rgba(79, 182, 161, 0.3)',
        'editorCursor.foreground': '#4FB6A1',
        'editorLineNumber.foreground': 'rgba(244, 246, 245, 0.42)',
        'editorLineNumber.activeForeground': 'rgba(244, 246, 245, 0.8)',
        'editor.inactiveSelectionBackground': 'rgba(79, 182, 161, 0.15)',
      },
    })
    monaco.editor.setTheme('rivryn')
  }

  const getLanguage = useCallback((fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      json: 'json',
      md: 'markdown',
      html: 'html',
      css: 'css',
    }
    return languageMap[ext] || 'javascript'
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleStartTyping = () => {
    if (editorRef.current) {
      editorRef.current.focus()
      setShowStartButton(false)
    }
  }

  const handleManualSave = async () => {
    if (editorRef.current) {
      const content = editorRef.current.getValue()
      setSaveStatus('saving')
      await onSave(content)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  return (
    <div className="w-full h-full relative">
      <Editor
        height="100%"
        language={getLanguage(fileName)}
        value={initialContent}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          fontSize: isMobile ? 16 : 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          cursorStyle: 'line',
          padding: { top: isMobile ? 60 : 16, bottom: isMobile ? 80 : 16 },
          smoothScrolling: true,
        }}
      />

      {/* Mobile-friendly floating action buttons */}
      {isMobile && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          {/* Save Status Indicator */}
          {saveStatus !== 'idle' && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              saveStatus === 'saving'
                ? 'bg-[#4FB6A1]/20 text-[#4FB6A1]'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {saveStatus === 'saving' ? 'Saving...' : 'Saved ✓'}
            </div>
          )}

          {/* Manual Save Button */}
          <button
            onClick={handleManualSave}
            className="p-3 bg-[#4FB6A1] text-[#0F1419] rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            title="Save file"
          >
            <Save size={20} />
          </button>
        </div>
      )}

      {/* Start Typing Button for Mobile */}
      {isMobile && showStartButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0F1419]/50 backdrop-blur-sm z-20">
          <button
            onClick={handleStartTyping}
            className="flex flex-col items-center gap-3 px-8 py-6 bg-[#4FB6A1] text-[#0F1419] rounded-2xl shadow-2xl hover:opacity-90 active:scale-95 transition-all"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Keyboard size={32} />
            <span className="text-lg font-semibold">Start Typing</span>
            <span className="text-sm opacity-80">Tap to begin coding</span>
          </button>
        </div>
      )}
    </div>
  )
}
