'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Folder, Plus, X, Loader2 } from 'lucide-react'

interface File {
  id: string
  name: string
  path: string
  content: string
}

interface FileExplorerProps {
  files: File[]
  selectedFileId: string | null
  onSelectFile: (fileId: string) => void
  onCreateFile?: (name: string, path: string) => Promise<void>
  onDeleteFile?: (fileId: string) => Promise<void>
  onRenameFile?: (fileId: string, newName: string, newPath: string) => Promise<void>
}

export function FileExplorer({
  files,
  selectedFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))
  const [showCreateFile, setShowCreateFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null)
  const [renamingName, setRenamingName] = useState('')
  const [renamingFilePath, setRenamingFilePath] = useState<string | null>(null)
  const [isCreatingFile, setIsCreatingFile] = useState(false)

  // Group files by folder
  const buildTree = () => {
    const tree: Record<string, File[]> = {}
    files.forEach((file) => {
      const dir = file.path.substring(0, file.path.lastIndexOf('/')) || 'root'
      if (!tree[dir]) tree[dir] = []
      tree[dir].push(file)
    })
    return tree
  }

  const tree = buildTree()

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder)
    } else {
      newExpanded.add(folder)
    }
    setExpandedFolders(newExpanded)
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !onCreateFile || isCreatingFile) return
    setIsCreatingFile(true)
    try {
      await onCreateFile(newFileName, `/${newFileName}`)
      setNewFileName('')
      setShowCreateFile(false)
    } catch (error) {
      console.error('Failed to create file:', error)
    } finally {
      setIsCreatingFile(false)
    }
  }

  const handleRenameFile = async (fileId: string) => {
    if (!renamingName.trim() || !onRenameFile || !renamingFilePath) return
    try {
      const dir = renamingFilePath.substring(0, renamingFilePath.lastIndexOf('/')) || ''
      const newPath = dir ? `${dir}/${renamingName}` : `/${renamingName}`
      await onRenameFile(fileId, renamingName, newPath)
      setRenamingFileId(null)
      setRenamingName('')
      setRenamingFilePath(null)
    } catch (error) {
      console.error('Failed to rename file:', error)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#1E2937] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#4FB6A1]/20">
        <h3 className="font-semibold text-[#F5F7F6] text-base">Files</h3>
        <button
          onClick={() => setShowCreateFile(true)}
          className="p-2 hover:bg-[#F5F7F6]/10 rounded-lg transition active:scale-95"
          title="Create file"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Plus size={20} className="text-[#4FB6A1]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 p-3">
        {showCreateFile && (
          <div className="bg-[#0F1419] border-2 border-[#4FB6A1] rounded-xl p-3 mb-3">
            <label className="block text-xs text-[#F5F7F6]/60 mb-2 font-medium">New File</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="index.ts"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFile()
                  if (e.key === 'Escape') setShowCreateFile(false)
                }}
                autoFocus
                className="flex-1 px-4 py-3 text-base bg-[#1E2937] border border-[#4FB6A1]/30 rounded-lg text-[#F5F7F6] placeholder-[#F5F7F6]/40 focus:outline-none focus:border-[#4FB6A1] focus:ring-2 focus:ring-[#4FB6A1]/20"
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={handleCreateFile}
                disabled={!newFileName.trim() || isCreatingFile}
                className="px-4 py-3 bg-[#4FB6A1] hover:bg-[#4FB6A1]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition active:scale-95 font-medium text-[#0F1419] text-sm flex items-center gap-2"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {isCreatingFile ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
            <button
              onClick={() => setShowCreateFile(false)}
              className="mt-2 text-xs text-[#F5F7F6]/40 hover:text-[#F5F7F6]/60"
            >
              Cancel (ESC)
            </button>
          </div>
        )}

        {Object.entries(tree).map(([folder, fileList]) => (
          <div key={folder}>
            {folder !== 'root' && (
              <div
                onClick={() => toggleFolder(folder)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F5F7F6]/5 rounded-lg transition active:scale-98"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {expandedFolders.has(folder) ? <ChevronDown size={16} className="text-[#4FB6A1]" /> : <ChevronRight size={16} className="text-[#4FB6A1]" />}
                <Folder size={16} className="text-[#4FB6A1]" />
                <span className="text-[#F5F7F6]/70 text-sm">{folder}</span>
              </div>
            )}

            {(folder === 'root' || expandedFolders.has(folder)) && (
              <div className={folder !== 'root' ? 'ml-2' : ''}>
                {fileList.map((file) => (
                  <div key={file.id}>
                    {renamingFileId === file.id ? (
                      <div className="flex items-center gap-2 px-3 py-2 mb-1">
                        <input
                          type="text"
                          value={renamingName}
                          onChange={(e) => setRenamingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFile(file.id)
                            if (e.key === 'Escape') {
                              setRenamingFileId(null)
                              setRenamingName('')
                              setRenamingFilePath(null)
                            }
                          }}
                          autoFocus
                          className="flex-1 px-3 py-2 text-sm bg-[#0F1419] border border-[#4FB6A1]/30 rounded-lg text-[#F5F7F6] focus:outline-none focus:border-[#4FB6A1]"
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => onSelectFile(file.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition truncate active:scale-98 ${
                          selectedFileId === file.id
                            ? 'bg-[#4FB6A1]/20 text-[#4FB6A1]'
                            : 'text-[#F5F7F6]/60 hover:bg-[#F5F7F6]/5 hover:text-[#F5F7F6]'
                        }`}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setRenamingFileId(file.id)
                          setRenamingName(file.name)
                          setRenamingFilePath(file.path)
                        }}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        <FileText size={16} className="flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        {selectedFileId === file.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteFile?.(file.id)
                            }}
                            className="ml-auto p-1.5 hover:bg-[#C97A4A]/20 rounded transition active:scale-95"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                            <X size={14} className="text-[#C97A4A]" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
