'use client';

import dynamic from 'next/dynamic';
import { defaultEditorOptions } from '@/lib/monaco-config';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Loading Monaco Editor...</div>
      </div>
    )
  }
);

interface CodeEditorProps {
  defaultValue?: string;
  defaultLanguage?: string;
  onChange?: (value: string | undefined) => void;
  theme?: string;
  height?: string;
}

export function CodeEditor({
  defaultValue = '// Start coding...',
  defaultLanguage = 'javascript',
  onChange,
  theme = 'vs-dark',
  height = '100vh'
}: CodeEditorProps) {
  return (
    <MonacoEditor
      height={height}
      defaultLanguage={defaultLanguage}
      defaultValue={defaultValue}
      onChange={onChange}
      theme={theme}
      options={defaultEditorOptions}
      beforeMount={(monaco) => {
        // Monaco is ready
        console.log('Monaco Editor loaded successfully');
      }}
      onMount={(editor, monaco) => {
        // Editor is mounted
        console.log('Monaco Editor mounted');
        // Focus editor
        editor.focus();
      }}
    />
  );
}
