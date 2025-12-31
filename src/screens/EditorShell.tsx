'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CodeEditor } from '@/components/CodeEditor'
import { FileExplorer } from '@/components/FileExplorer'
import { ModeSwitcher } from '@/components/ModeSwitcher'
import { Agent } from '@/components/Agent'
import { ArrowLeft } from 'lucide-react'

interface File {
  id: string
  name: string
  path: string
  content: string
}

export default function EditorShellPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [files, setFiles] = useState<File[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [currentMode, setCurrentMode] = useState<'code' | 'agent' | 'terminal' | 'preview'>('code')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [projectName, setProjectName] = useState('')
  const [showFilePanel, setShowFilePanel] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function initialize() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        setUser(authUser)

        if (!projectId) {
          router.push('/')
          return
        }

        // Load project
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('userId', authUser?.id)
          .single()

        if (!projectData) {
          router.push('/')
          return
        }

        setProjectName(projectData.name)

        // Load files
        const filesRes = await fetch(`/api/files?projectId=${projectId}`)
        const filesData = await filesRes.json()
        setFiles(Array.isArray(filesData) ? filesData : [])

        if (filesData.length > 0) {
          setSelectedFileId(filesData[0].id)
        }
      } catch (error) {
        console.error('Failed to initialize:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [projectId, router, supabase])

  async function handleSaveFile(content: string) {
    if (!selectedFileId) return
    try {
      await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedFileId,
          content,
        }),
      })
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }

  async function handleCreateFile(name: string, path: string) {
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name,
          path,
          content: '',
        }),
      })
      const newFile = await res.json()
      setFiles([...files, newFile])
      setSelectedFileId(newFile.id)
      setShowFilePanel(false)
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  async function handleDeleteFile(fileId: string) {
    try {
      await fetch(`/api/files?id=${fileId}`, { method: 'DELETE' })
      setFiles(files.filter((f) => f.id !== fileId))
      if (selectedFileId === fileId) {
        setSelectedFileId(files[0]?.id || null)
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  async function handleRenameFile(fileId: string, newName: string, newPath: string) {
    try {
      const res = await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fileId, name: newName, path: newPath }),
      })
      const updated = await res.json()
      setFiles(files.map((f) => (f.id === fileId ? updated : f)))
    } catch (error) {
      console.error('Failed to rename file:', error)
    }
  }

  const selectedFile = files.find((f) => f.id === selectedFileId)

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-textSecondary">Loading editor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-borderSoft px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-1 hover:bg-surfaceSoft rounded transition"
          >
            <ArrowLeft size={20} className="text-textSecondary" />
          </button>
          <div>
            <h1 className="font-bold text-textPrimary">{projectName}</h1>
            <p className="text-xs text-textMuted">{files.length} files</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilePanel(!showFilePanel)}
          className="px-3 py-1 text-sm text-textSecondary hover:text-textPrimary transition md:hidden"
        >
          Files
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden pb-20 md:pb-0">
        {/* File Explorer */}
        <div className={`hidden md:flex w-64 flex-col ${showFilePanel ? 'flex md:flex' : 'hidden'}`}>
          <FileExplorer
            files={files}
            selectedFileId={selectedFileId}
            onSelectFile={setSelectedFileId}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
          />
        </div>

        {/* Mobile File Panel */}
        {showFilePanel && (
          <div className="absolute inset-0 z-30 flex flex-col md:hidden bg-bg">
            <div className="flex items-center justify-between p-3 border-b border-borderSoft">
              <h2 className="font-bold text-textPrimary">Files</h2>
              <button
                onClick={() => setShowFilePanel(false)}
                className="text-textSecondary hover:text-textPrimary"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <FileExplorer
                files={files}
                selectedFileId={selectedFileId}
                onSelectFile={(fileId) => {
                  setSelectedFileId(fileId)
                  setShowFilePanel(false)
                }}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
              />
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File Tabs */}
          <div className="bg-surfaceSoft border-b border-borderSoft flex gap-1 px-2 overflow-x-auto">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`px-3 py-2 text-sm whitespace-nowrap transition ${
                  selectedFileId === file.id
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {file.name}
              </button>
            ))}
          </div>

          {/* Editor */}
          {selectedFile ? (
            <div className="flex-1 overflow-hidden">
              {currentMode === 'code' && (
                <CodeEditor
                  initialContent={selectedFile.content}
                  fileName={selectedFile.name}
                  onSave={handleSaveFile}
                  onChange={() => {}}
                />
              )}
              {currentMode === 'agent' && (
                <Agent
                  projectId={projectId}
                  userId={user?.id || ''}
                  onFileChange={async () => {
                    const filesRes = await fetch(`/api/files?projectId=${projectId}`)
                    const filesData = await filesRes.json()
                    setFiles(Array.isArray(filesData) ? filesData : [])
                  }}
                />
              )}
              {currentMode === 'terminal' && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-textMuted">Terminal mode (coming Week 3)</p>
                </div>
              )}
              {currentMode === 'preview' && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-textMuted">Preview mode (coming Week 3)</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-textMuted">No files in project</p>
            </div>
          )}
        </div>
      </div>

      {/* Mode Switcher */}
      <ModeSwitcher currentMode={currentMode} onModeChange={setCurrentMode} />
    </div>
  )
}