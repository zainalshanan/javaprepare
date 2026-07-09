import type { GradeResult } from '../types';

function StatusBanner({ result }: { result: GradeResult }) {
  const map: Record<GradeResult['status'], { label: string; cls: string }> = {
    'pass': { label: 'All tests passed', cls: 'bg-pass/15 text-pass border-pass/40' },
    'fail': { label: 'Not quite', cls: 'bg-fail/10 text-fail border-fail/40' },
    'compile-error': { label: "Doesn't compile", cls: 'bg-fail/10 text-fail border-fail/40' },
    'runtime-error': { label: 'Crashed while running', cls: 'bg-fail/10 text-fail border-fail/40' },
    'timeout': { label: 'Time limit exceeded', cls: 'bg-amber/10 text-amber border-amber/40' },
    'error': { label: 'Grader error', cls: 'bg-fail/10 text-fail border-fail/40' },
  };
  const { label, cls } = map[result.status];
  return (
    <div className={`flex items-baseline justify-between rounded-md border px-3 py-2 text-sm font-medium ${cls}`}>
      <span>{label}</span>
      {result.total !== undefined && (
        <span className="font-mono text-xs opacity-80">{result.passed}/{result.total} tests</span>
      )}
    </div>
  );
}

export function TestResults({ result }: { result: GradeResult }) {
  return (
    <div className="space-y-2">
      <StatusBanner result={result} />

      {result.message && (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-[#10182a] p-3 font-mono text-xs leading-relaxed text-paper/90">
          {result.message}
        </pre>
      )}

      {result.actualOutput !== undefined && result.status !== 'pass' && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <OutputBox label="Your output" value={result.actualOutput || '(nothing printed)'} bad />
          <OutputBox label="Expected output" value={result.expectedOutput ?? ''} />
        </div>
      )}

      {result.results && (
        <ul className="space-y-1.5">
          {result.results.map((t) => (
            <li key={t.index} className={`rounded-md border px-3 py-2 text-xs ${t.pass ? 'border-pass/25 bg-pass/5' : 'border-fail/25 bg-fail/5'}`}>
              <div className="flex items-center gap-2 font-medium">
                <span className={t.pass ? 'text-pass' : 'text-fail'}>{t.pass ? '✓' : '✗'}</span>
                <span className="text-paper/90">
                  {t.hidden ? `Hidden test ${t.index + 1}` : `Test ${t.index + 1}`}
                  {t.note ? <span className="ml-1 text-dim">— {t.note}</span> : null}
                </span>
                {t.timeMs !== undefined && <span className="ml-auto font-mono text-dim">{t.timeMs} ms</span>}
              </div>
              {!t.hidden && t.input !== undefined && (
                <div className="mt-1.5 space-y-0.5 font-mono text-[11px] leading-relaxed text-dim">
                  <div className="whitespace-pre-wrap"><span className="text-paper/60">input:</span> {t.input}</div>
                  {t.expected !== undefined && <div><span className="text-paper/60">expected:</span> {t.expected}</div>}
                  {t.actual !== undefined && !t.pass && <div><span className="text-fail/80">got:</span> {t.actual}</div>}
                </div>
              )}
              {t.error && <div className="mt-1 font-mono text-[11px] text-fail/90">{t.error}</div>}
              {t.debug && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-[11px] text-dim">your printed output</summary>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-dim">{t.debug}</pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OutputBox({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div>
      <div className={`mb-1 text-[11px] font-medium uppercase tracking-wide ${bad ? 'text-fail/80' : 'text-dim'}`}>{label}</div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-[#10182a] p-2.5 font-mono text-xs leading-relaxed">{value}</pre>
    </div>
  );
}
