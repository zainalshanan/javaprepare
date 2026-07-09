import { useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';

let themeDefined = false;

export function CodeEditor({ value, onChange, height = 320, onCmdEnter }: {
  value: string;
  onChange: (v: string) => void;
  height?: number | string;
  onCmdEnter?: () => void;
}) {
  // Keep the latest submit handler so the Monaco command (registered once) always calls it.
  const cmdEnterRef = useRef(onCmdEnter);
  cmdEnterRef.current = onCmdEnter;

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <Editor
        height={height}
        language="java"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={(editor, monaco) => {
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            cmdEnterRef.current?.();
          });
        }}
        beforeMount={(monaco) => {
          if (!themeDefined) {
            monaco.editor.defineTheme('javaprep', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'keyword', foreground: 'c792ea' },
                { token: 'string', foreground: '5cd69a' },
                { token: 'number', foreground: 'f5b84c' },
                { token: 'comment', foreground: '64748f', fontStyle: 'italic' },
                { token: 'type', foreground: '6fa8ff' },
              ],
              colors: {
                'editor.background': '#10182a',
                'editor.lineHighlightBackground': '#1b274066',
                'editorLineNumber.foreground': '#3d4f73',
                'editorCursor.foreground': '#f5b84c',
              },
            });
            themeDefined = true;
          }
        }}
        theme="javaprep"
        options={{
          fontSize: 13.5,
          fontFamily: 'JetBrains Mono, monospace',
          fontLigatures: false,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          tabSize: 4,
          renderLineHighlight: 'line',
          overviewRulerLanes: 0,
          scrollbar: { verticalScrollbarSize: 10 },
          automaticLayout: true,
        }}
      />
    </div>
  );
}

export { loader };
