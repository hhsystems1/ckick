'use client'

import { useEffect, useRef, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { markdown } from '@codemirror/lang-markdown'
import { html } from '@codemirror/lang-html'

interface CodeEditorProps {
  initialContent: string
  fileName: string
  onSave: (content: string) => Promise<void>
  onChange?: (content: string) => void
}

function getLanguageExtension(fileName: string) {
  if (fileName.endsWith('.ts') || fileName.endsWith('.tsx') || fileName.endsWith('.js') || fileName.endsWith('.jsx')) {
    return javascript({ jsx: true, typescript: true })
  }
  if (fileName.endsWith('.py')) {
    return python()
  }
  if (fileName.endsWith('.json')) {
    return javascript() // JSON is handled by javascript language
  }
  if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
    return markdown()
  }
  if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
    return html()
  }
  return javascript()
}

// Rivryn dark theme
const rivrynTheme = EditorView.theme({
  '.cm-editor': {
    backgroundColor: '#0E1110',
    color: '#F4F6F5',
  },
  '.cm-gutters': {
    backgroundColor: '#1A1F1D',
    borderRight: '1px solid rgba(244,246,245,0.06)',
    color: 'rgba(244,246,245,0.42)',
  },
  '.cm-linenumber': {
    color: 'rgba(244,246,245,0.42)',
  },
  '.cm-cursor': {
    borderLeftColor: '#4FB6A1',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(79,182,161,0.1)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(79,182,161,0.05)',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'rgba(79,182,161,0.2)',
  },
  '.cm-selection': {
    backgroundColor: 'rgba(79,182,161,0.3)',
  },
  '.cm-searchMatch': {
    backgroundColor: 'rgba(79,182,161,0.2)',
  },
  '.cm-searchMatch-selected': {
    backgroundColor: 'rgba(79,182,161,0.4)',
  },
}, { dark: true })

export function CodeEditor({ initialContent, fileName, onSave, onChange }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSave = useCallback(async (content: string) => {
    try {
      await onSave(content)
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }, [onSave])

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        getLanguageExtension(fileName),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString()
            onChange?.(newContent)

            // Autosave after 1 second of inactivity
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current)
            }
            saveTimeoutRef.current = setTimeout(() => {
              handleSave(newContent)
            }, 1000)
          }
        }),
        rivrynTheme,
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      view.destroy()
    }
  }, [fileName, initialContent, onChange, handleSave])

  return <div ref={containerRef} className="w-full h-full" style={{ fontSize: '14px' }} />
}
