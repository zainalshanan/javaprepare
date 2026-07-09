import { useMemo, useState } from 'react';
import { api } from '../api';
import type { ExerciseState, ExerciseView, GradeResult } from '../types';
import { CodeEditor } from './CodeEditor';
import { HintPanel } from './HintPanel';
import { Markdown } from './Markdown';
import { Pips } from './Pips';
import { TestResults } from './TestResults';

/** Shared shell: title row with drill pips + status, prompt, body. */
export function ExerciseCard({ ex, review, onStateChange }: {
  ex: ExerciseView;
  review?: boolean;
  onStateChange?: (s: ExerciseState) => void;
}) {
  const [state, setState] = useState<ExerciseState>(ex.state);
  const handleState = (s: ExerciseState) => {
    setState(s);
    onStateChange?.(s);
  };

  return (
    <section className="rounded-xl border border-line bg-panel/60">
      <header className="flex items-center gap-3 border-b border-line/70 px-4 py-2.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-dim">
          {ex.drill ? 'drill' : label(ex.type)}
        </span>
        <h3 className="font-display text-[15px] font-semibold">{ex.title}</h3>
        <div className="ml-auto flex items-center gap-2">
          {ex.drill && <Pips consecutive={state.consecutive} target={ex.drillTarget} mastered={state.status === 'mastered'} />}
          {!ex.drill && (state.status === 'completed' || state.status === 'mastered') && (
            <span className="text-xs font-medium text-pass">✓ done</span>
          )}
        </div>
      </header>
      <div className="space-y-3 px-4 py-3.5">
        {ex.prompt && <Markdown>{ex.prompt}</Markdown>}
        {ex.drill && state.status !== 'mastered' && (
          <p className="text-[11px] text-dim">
            Drill: get it right {ex.drillTarget} times in a row to master it. A miss resets the streak.
          </p>
        )}
        <ExerciseBody ex={ex} state={state} review={review} onState={handleState} />
      </div>
    </section>
  );
}

function label(t: ExerciseView['type']) {
  return t === 'mcq' ? 'quiz' : t === 'fill-blank' ? 'fill in' : t === 'code-output' ? 'write a program' : 'implement';
}

function ExerciseBody({ ex, state, review, onState }: {
  ex: ExerciseView; state: ExerciseState; review?: boolean; onState: (s: ExerciseState) => void;
}) {
  switch (ex.type) {
    case 'mcq': return <McqBody ex={ex} review={review} onState={onState} />;
    case 'fill-blank': return <FillBlankBody ex={ex} review={review} onState={onState} />;
    default: return <CodeBody ex={ex} state={state} review={review} onState={onState} />;
  }
}

// ---------- MCQ ----------

function McqBody({ ex, review, onState }: { ex: ExerciseView; review?: boolean; onState: (s: ExerciseState) => void }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (i: number) => {
    setResult(null);
    setSelected((cur) => ex.multi ? (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]) : [i]);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await api.submit(ex.id, { answer: ex.multi ? selected : selected[0], review });
      setResult(res.result);
      onState(res.state);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {ex.options!.map((opt, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              selected.includes(i)
                ? 'border-amber bg-amber/10 text-paper'
                : 'border-line bg-panel hover:border-dim'
            }`}
          >
            <span className="mr-2 font-mono text-xs text-dim">{String.fromCharCode(65 + i)}</span>
            <InlineCodeText text={opt} />
          </button>
        ))}
      </div>
      <SubmitRow busy={busy} disabled={selected.length === 0} onSubmit={submit} label="Check answer" />
      {result && <QuizVerdict result={result} />}
    </div>
  );
}

/** Renders `code` spans inside option/quiz text. */
function InlineCodeText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`')
          ? <code key={i} className="rounded bg-panel-2 px-1 py-0.5 font-mono text-[0.85em]">{p.slice(1, -1)}</code>
          : <span key={i}>{p}</span>,
      )}
    </>
  );
}

function QuizVerdict({ result }: { result: GradeResult }) {
  const pass = result.status === 'pass';
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${pass ? 'border-pass/40 bg-pass/10' : 'border-fail/40 bg-fail/10'}`}>
      <span className={`font-medium ${pass ? 'text-pass' : 'text-fail'}`}>{pass ? 'Correct.' : 'Not quite — try again.'}</span>
      {result.message && <div className="mt-1 text-paper/85"><InlineCodeText text={result.message} /></div>}
    </div>
  );
}

// ---------- Fill in the blank ----------

function FillBlankBody({ ex, review, onState }: { ex: ExerciseView; review?: boolean; onState: (s: ExerciseState) => void }) {
  const segments = useMemo(() => parseBlanks(ex.code ?? ''), [ex.code]);
  const blankKeys = segments.filter((s) => s.kind === 'blank').map((s) => (s as { key: string }).key);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [wrongKeys, setWrongKeys] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await api.submit(ex.id, { answers: values, review });
      setResult(res.result);
      onState(res.state);
      const wrong = new Set<string>();
      const m = res.result.message?.match(/Blanks? ([\w, ]+) (?:are|is) incorrect/);
      if (m) for (const k of m[1].split(',').map((s) => s.trim())) wrong.add(k);
      setWrongKeys(res.result.status === 'pass' ? new Set() : wrong);
    } finally {
      setBusy(false);
    }
  };

  const allFilled = blankKeys.every((k) => (values[k] ?? '').trim().length > 0);

  return (
    <div className="space-y-3">
      <pre className="overflow-x-auto rounded-lg border border-line bg-[#10182a] p-3.5 font-mono text-[13px] leading-[1.9]">
        {segments.map((s, i) =>
          s.kind === 'text' ? (
            <span key={i}>{s.text}</span>
          ) : (
            <input
              key={i}
              value={values[s.key] ?? ''}
              onChange={(e) => { setResult(null); setValues((v) => ({ ...v, [s.key]: e.target.value })); }}
              size={Math.max(6, (values[s.key] ?? '').length + 1)}
              spellCheck={false}
              autoComplete="off"
              className={`blank-input ${result ? (result.status === 'pass' ? 'blank-good' : wrongKeys.size === 0 || wrongKeys.has(s.key) ? 'blank-bad' : 'blank-good') : ''}`}
            />
          ),
        )}
      </pre>
      <SubmitRow busy={busy} disabled={!allFilled} onSubmit={submit} label="Check answer" />
      {result && <QuizVerdict result={result} />}
    </div>
  );
}

function parseBlanks(code: string): ({ kind: 'text'; text: string } | { kind: 'blank'; key: string })[] {
  const out: ({ kind: 'text'; text: string } | { kind: 'blank'; key: string })[] = [];
  let last = 0;
  for (const m of code.matchAll(/\{\{(\w+)\}\}/g)) {
    if (m.index! > last) out.push({ kind: 'text', text: code.slice(last, m.index) });
    out.push({ kind: 'blank', key: m[1] });
    last = m.index! + m[0].length;
  }
  if (last < code.length) out.push({ kind: 'text', text: code.slice(last) });
  return out;
}

// ---------- Code (output / method / design) ----------

function CodeBody({ ex, state, review, onState }: {
  ex: ExerciseView; state: ExerciseState; review?: boolean; onState: (s: ExerciseState) => void;
}) {
  const [code, setCode] = useState(ex.starter ?? '');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const lines = (ex.starter ?? '').split('\n').length;
  const height = Math.min(480, Math.max(180, (lines + 6) * 21));

  const submit = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await api.submit(ex.id, { code, review });
      setResult(res.result);
      onState(res.state);
    } catch (e) {
      setResult({ status: 'error', message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {ex.type === 'code-output' && ex.expectedOutput !== undefined && (
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-dim">Your program must print exactly</div>
          <pre className="rounded-md border border-line bg-[#10182a] p-2.5 font-mono text-xs leading-relaxed">{ex.expectedOutput}</pre>
        </div>
      )}
      {ex.visibleTests && ex.visibleTests.length > 0 && (
        <details className="rounded-md border border-line bg-panel" open={!ex.drill}>
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-dim">
            Example tests ({ex.visibleTests.length} shown{ex.hiddenTestCount ? `, ${ex.hiddenTestCount} hidden` : ''})
          </summary>
          <div className="space-y-1.5 border-t border-line/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-dim">
            {ex.visibleTests.map((t, i) => (
              <div key={i}>
                <span className="text-paper/70">{t.input}</span> → <span className="text-pass/90">{t.expected}</span>
                {t.note && <span className="ml-1.5 text-dim">({t.note})</span>}
              </div>
            ))}
          </div>
        </details>
      )}
      <CodeEditor value={code} onChange={setCode} height={height} onCmdEnter={submit} />
      <div className="flex items-center gap-3">
        <SubmitRow busy={busy} disabled={false} onSubmit={submit} label={busy ? 'Compiling…' : 'Run & grade'} />
        <button
          onClick={() => { setCode(ex.starter ?? ''); setResult(null); }}
          className="rounded-md border border-line px-2.5 py-1.5 text-xs text-dim hover:text-paper"
          title={ex.drill ? 'Drills start from a blank file' : 'Restore the starter code'}
        >
          Reset code
        </button>
        <span className="ml-auto hidden text-[11px] text-dim sm:inline">⌘/Ctrl + ↵ to run</span>
      </div>
      {result && <TestResults result={result} />}
      <HintPanel
        exerciseId={ex.id}
        hintCount={ex.hintCount ?? 0}
        hasSolution={!!ex.hasSolution}
        attempts={state.attempts}
        initialHintsUsed={state.hintsUsed}
      />
    </div>
  );
}

function SubmitRow({ busy, disabled, onSubmit, label }: { busy: boolean; disabled: boolean; onSubmit: () => void; label: string }) {
  return (
    <button
      onClick={onSubmit}
      disabled={busy || disabled}
      className="rounded-md bg-amber px-4 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-amber-deep disabled:cursor-not-allowed disabled:opacity-40"
    >
      {busy ? 'Grading…' : label}
    </button>
  );
}
