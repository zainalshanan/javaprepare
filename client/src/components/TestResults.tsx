import type { GradeResult } from '../types';

function StatusBanner({ result, examplesOnly }: { result: GradeResult; examplesOnly?: boolean }) {
  const map: Record<GradeResult['status'], { label: string; cls: string }> = {
    'pass': { label: examplesOnly ? 'All examples pass' : 'All tests passed', cls: 'bg-pass/15 text-pass border-pass/40' },
    'fail': { label: 'Not quite', cls: 'bg-fail/10 text-fail border-fail/40' },
    'compile-error': { label: "Doesn't compile", cls: 'bg-fail/10 text-fail border-fail/40' },
    'runtime-error': { label: 'Crashed while running', cls: 'bg-fail/10 text-fail border-fail/40' },
    'timeout': { label: 'Time limit exceeded', cls: 'bg-amber/10 text-amber border-amber/40' },
    'error': { label: 'Grader error', cls: 'bg-fail/10 text-fail border-fail/40' },
  };
  const { label, cls } = map[result.status];
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium ${cls}`}>
      <span>
        {label}
        {examplesOnly && <span className="ml-2 text-xs font-normal text-dim">examples only — not graded, not an attempt</span>}
      </span>
      {result.total !== undefined && (
        <span className="font-mono text-xs opacity-80">{result.passed}/{result.total} {examplesOnly ? 'examples' : 'tests'}</span>
      )}
    </div>
  );
}

export function TestResults({ result, examplesOnly }: { result: GradeResult; examplesOnly?: boolean }) {
  return (
    <div className="space-y-2">
      <StatusBanner result={result} examplesOnly={examplesOnly} />

      {result.message && (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-code p-3 font-mono text-xs leading-relaxed text-paper/90">
          {result.message}
        </pre>
      )}

      {result.actualOutput !== undefined && result.status !== 'pass' && (
        <OutputDiff actual={result.actualOutput} expected={result.expectedOutput ?? ''} />
      )}

      {result.results && (
        <ul className="space-y-1.5">
          {result.results.map((t) => (
            <li key={t.index} className={`rounded-md border px-3 py-2 text-xs ${t.pass ? 'border-pass/25 bg-pass/5' : 'border-fail/25 bg-fail/5'}`}>
              <div className="flex items-center gap-2 font-medium">
                <span className={t.pass ? 'text-pass' : 'text-fail'} aria-hidden="true">{t.pass ? '✓' : '✗'}</span>
                <span className="sr-only">{t.pass ? 'passed' : 'failed'}:</span>
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

/** Line-by-line comparison of program output; differing lines are highlighted. */
function OutputDiff({ actual, expected }: { actual: string; expected: string }) {
  const a = actual === '' ? [] : actual.split('\n');
  const e = expected === '' ? [] : expected.split('\n');
  const n = Math.max(a.length, e.length, 1);
  const firstDiff = Array.from({ length: n }, (_, i) => i).find((i) => a[i] !== e[i]);
  return (
    <div className="overflow-hidden rounded-md border border-line">
      <div className="flex flex-wrap items-baseline gap-x-3 border-b border-line bg-panel px-3 py-1.5 text-[11px] text-dim">
        <span className="font-medium uppercase tracking-wide">Output diff</span>
        {firstDiff !== undefined && <span>first difference on line {firstDiff + 1}</span>}
        {actual === '' && <span className="text-fail">your program printed nothing</span>}
      </div>
      <div className="overflow-x-auto bg-code">
        <table className="w-full border-collapse font-mono text-xs leading-relaxed">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-dim">
              <th className="w-8 px-2 py-1 font-medium">#</th>
              <th className="px-2 py-1 font-medium">Your output</th>
              <th className="px-2 py-1 font-medium">Expected</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, i) => {
              const same = a[i] === e[i];
              return (
                <tr key={i} className={same ? '' : 'bg-fail/10'}>
                  <td className="px-2 align-top text-dim">{i + 1}</td>
                  <td className={`whitespace-pre px-2 align-top ${same ? 'text-paper/80' : 'text-fail'}`}>
                    {a[i] ?? <span className="italic text-dim">(missing)</span>}
                  </td>
                  <td className={`whitespace-pre px-2 align-top ${same ? 'text-paper/80' : 'text-pass'}`}>
                    {e[i] ?? <span className="italic text-dim">(no line)</span>}
                    {!same && <span className="sr-only"> (differs)</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
