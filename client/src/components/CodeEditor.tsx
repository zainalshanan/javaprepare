import { useEffect, useRef, useState } from 'react';
import Editor, { loader, type OnMount } from '@monaco-editor/react';
import { useTheme } from '../theme';

let themeDefined = false;

type MonacoEditor = Parameters<OnMount>[0];
type Monaco = Parameters<OnMount>[1];
export interface EditorMarker { line: number; message: string }
const NO_MARKERS: EditorMarker[] = [];

export function CodeEditor({ value, onChange, height = 320, onCmdEnter, markers = NO_MARKERS }: {
  value: string;
  onChange: (v: string) => void;
  height?: number;
  onCmdEnter?: () => void;
  /** javac errors to underline (1-based lines). */
  markers?: EditorMarker[];
}) {
  // Keep the latest submit handler so the Monaco command (registered once) always calls it.
  const cmdEnterRef = useRef(onCmdEnter);
  cmdEnterRef.current = onCmdEnter;
  const theme = useTheme();
  const [mounted, setMounted] = useState<{ editor: MonacoEditor; monaco: Monaco } | null>(null);

  useEffect(() => {
    if (!mounted) return;
    const model = mounted.editor.getModel();
    if (!model) return;
    const lineCount = model.getLineCount();
    mounted.monaco.editor.setModelMarkers(model, 'javac', markers.map((m) => {
      const line = Math.min(Math.max(1, m.line), lineCount);
      return {
        startLineNumber: line, endLineNumber: line, startColumn: 1, endColumn: model.getLineMaxColumn(line),
        message: m.message, severity: mounted.monaco.MarkerSeverity.Error,
      };
    }));
  }, [mounted, markers]);

  return (
    // Vertically resizable: drag the bottom-right corner. automaticLayout keeps Monaco in sync.
    <div className="resize-y overflow-hidden rounded-lg border border-line" style={{ height, minHeight: 160 }}>
      <Editor
        height="100%"
        language="java"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={(editor, monaco) => {
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            cmdEnterRef.current?.();
          });
          setMounted({ editor, monaco });
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
            monaco.editor.defineTheme('javaprep-light', {
              base: 'vs',
              inherit: true,
              rules: [
                { token: 'keyword', foreground: '8b3fc7' },
                { token: 'string', foreground: '15803d' },
                { token: 'number', foreground: 'b45309' },
                { token: 'comment', foreground: '6b7a90', fontStyle: 'italic' },
                { token: 'type', foreground: '1d4ed8' },
              ],
              colors: {
                'editor.background': '#f0f3f9',
                'editor.lineHighlightBackground': '#e1e7f166',
                'editorLineNumber.foreground': '#a3adc2',
                'editorCursor.foreground': '#b7791f',
              },
            });
            themeDefined = true;
          }
        }}
        theme={theme === 'light' ? 'javaprep-light' : 'javaprep'}
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
