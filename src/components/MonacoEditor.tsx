'use client'

import { useRef, useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'

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

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const content = editor.getValue()
      onSave(content)
    })

    editor.onDidChangeModelContent(() => {
      const content = editor.getValue()
      onChange?.(content)

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        onSave(content)
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

  return (
    <div className="w-full h-full">
      <Editor
        height="100%"
        language={getLanguage(fileName)}
        value={initialContent}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          fontSize: 14,
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
          padding: { top: 16, bottom: 16 },
          smoothScrolling: true,
        }}
      />
    </div>
  )
}
