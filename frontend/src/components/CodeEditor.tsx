import React from 'react';
import Editor from '@monaco-editor/react';
import { FileItem } from '../types';

interface CodeEditorProps {
  file: FileItem | null;
  loading?: boolean;
}

export function CodeEditor({ file, loading = false }: CodeEditorProps) {
  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            {loading ? (
              <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {loading ? 'Generating Project...' : 'No file selected'}
          </h3>
          <p className="text-sm text-gray-500">
            {loading ? 'Creating your project files...' : 'Choose a file from the explorer to view its contents'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-light"
        value={file.content || ''}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          renderLineHighlight: 'gutter',
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}