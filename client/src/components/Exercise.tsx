import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import type { ExerciseState, ExerciseView, GradeResult, SubmitResponse } from '../types';
import { CodeEditor } from './CodeEditor';
import { HintPanel } from './HintPanel';
import { Markdown } from './Markdown';
import { Pips } from './Pips';
import { TestResults } from './TestResults';

type ReviewOutcome = NonNullable<SubmitResponse['review']>;

interface BodyProps {
  ex: ExerciseView;
  state: ExerciseState;
  review?: boolean;
  /** Review: this card has been graded — Run is replaced with Next. */
  locked: boolean;
  reviewOutcome: ReviewOutcome | null;
  onNext?: () => void;
  onResponse: (res: SubmitResponse) => void;
  onState: (s: ExerciseState) => void;
  /** Drill reps passed this session; hint panel remounts per rep. */
  rep: number;
}

/** Shared shell: title row with drill pips + status, prompt, body. */
export function ExerciseCard({ ex, review, onStateChange, onReviewGraded, onNext }: {
  ex: ExerciseView;
  review?: boolean;
  onStateChange?: (s: ExerciseState) => void;
  /** Review mode: first real verdict for this card (graded or, when reviewing ahead, practice). */
  onReviewGraded?: (r: ReviewOutcome) => void;
  onNext?: () => void;
}) {
  const [state, setState] = useState<ExerciseState>(ex.state);
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome | null>(null);
  const [repNote, setRepNote] = useState<{ text: string; good: boolean } | null>(null);
  const [rep, setRep] = useState(0);

  const handleState = (s: ExerciseState) => {
    setState(s);
    onStateChange?.(s);
  };

  const handleResponse = (res: SubmitResponse) => {
    handleState(res.state);
    if (res.skipped || !res.result) return;
    const status = res.result.status;
    if (review && res.review && !reviewOutcome && status !== 'compile-error' && status !== 'error') {
      setReviewOutcome(res.review);
      onReviewGraded?.(res.review);
    }
    if (!review && res.drill) {
      if (status === 'pass') {
        const { counted, consecutive, target, justMastered } = res.drill;
        setRep((r) => r + 1);
        setRepNote(
          justMastered ? { text: 'Mastered! It will come back in Review on a spaced schedule.', good: true }
          : !counted ? { text: 'Passed — but you used help this rep, so it didn’t count. Type it again from memory.', good: false }
          : consecutive > target ? { text: 'Still got it (already mastered). Type it again from memory for extra practice.', good: true }
          : { text: `Rep ${consecutive}/${target} — type it again from memory.`, good: true },
        );
      } else {
        setRepNote(null);
      }
    }
  };

  const done = state.status === 'completed' || state.status === 'mastered';
  return (
    <section id={`ex-${ex.id}`} className="scroll-mt-16 rounded-xl border border-line bg-panel/60">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/70 px-4 py-2.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-dim">
          {ex.drill ? 'drill' : label(ex.type)}
        </span>
        <h3 className="font-display text-[15px] font-semibold">{ex.title}</h3>
        <div className="ml-auto flex items-center gap-2">
          {ex.drill && <Pips consecutive={state.consecutive} target={ex.drillTarget} mastered={state.status === 'mastered'} />}
          {!ex.drill && done && (
            state.withHelp
              ? <span className="text-xs font-medium text-amber" title="Solved after using hints or the solution">✓ solved with help</span>
              : <span className="text-xs font-medium text-pass">✓ done</span>
          )}
        </div>
      </header>
      <div className="space-y-3 px-4 py-3.5">
        {ex.prompt && <Markdown>{ex.prompt}</Markdown>}
        {ex.drill && !review && state.status !== 'mastered' && (
          <p className="text-[11px] text-dim">
            Drill: get it right {ex.drillTarget} times in a row, from memory, to master it. A wrong answer resets the streak;
            a compile error doesn’t.
          </p>
        )}
        <ExerciseBody
          rep={rep}
          ex={ex} state={state} review={review}
          locked={!!reviewOutcome} reviewOutcome={reviewOutcome} onNext={onNext}
          onResponse={handleResponse} onState={handleState}
          repNote={repNote}
        />
      </div>
    </section>
  );
}

function label(t: ExerciseView['type']) {
  return t === 'mcq' ? 'quiz' : t === 'fill-blank' ? 'fill in' : t === 'code-output' ? 'write a program' : 'implement';
}

function ExerciseBody(props: BodyProps & { repNote: { text: string; good: boolean } | null }) {
  const { repNote, ...p } = props;
  const note = repNote && (
    <div role="status" className={`rounded-md border px-3 py-2 text-sm font-medium ${repNote.good ? 'border-pass/40 bg-pass/10 text-pass' : 'border-amber/40 bg-amber/10 text-amber'}`}>
      {repNote.text}
    </div>
  );
  switch (p.ex.type) {
    case 'mcq': return <McqBody {...p} note={note} />;
    case 'fill-blank': return <FillBlankBody {...p} note={note} />;
    default: return <CodeBody {...p} note={note} />;
  }
}

/** Guards against double submits (e.g. two quick Ctrl+Enter presses) before React re-renders. */
function useBusy() {
  const ref = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    if (ref.current) return;
    ref.current = true;
    setBusy(true);
    try { await fn(); } finally { ref.current = false; setBusy(false); }
  };
  return [busy, run] as const;
}

function NextButton({ onNext }: { onNext?: () => void }) {
  return (
    <button
      onClick={onNext}
      autoFocus
      className="rounded-md bg-amber px-4 py-1.5 text-sm font-semibold text-on-amber transition-colors hover:bg-amber-deep"
    >
      Next →
    </button>
  );
}

// ---------- MCQ ----------

function McqBody({ ex, state, review, locked, reviewOutcome, onNext, onResponse, onState, note }: BodyProps & { note: React.ReactNode }) {
  const [options, setOptions] = useState(ex.options ?? []);
  const [round, setRound] = useState(ex.round ?? 0);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ answer: number[]; explanation?: string } | null>(null);
  const [busy, run] = useBusy();

  const toggle = (i: number) => {
    setResult(null);
    setSelected((cur) => ex.multi ? (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]) : [i]);
  };

  const submit = () => run(async () => {
    if (locked || selected.length === 0) return;
    try {
      const res = await api.submit(ex.id, { answer: ex.multi ? selected : selected[0], review, round });
      setNotice(res.skipped ? res.message ?? null : null);
      if (res.result) setResult(res.result);
      // Drill rep passed: next rep gets a fresh order and a clean slate.
      if (!review && ex.drill && res.result?.status === 'pass' && res.options) {
        setOptions(res.options);
        setRound(res.state.round);
        setSelected([]);
        setRevealed(null);
      }
      onResponse(res);
    } catch (e) {
      setNotice((e as Error).message);
    }
  });

  const reveal = async () => {
    try {
      const r = await api.reveal(ex.id, round);
      setRevealed({ answer: r.answer ?? [], explanation: r.explanation });
      onState(r.state);
    } catch (e) {
      setNotice((e as Error).message);
    }
  };

  const canShowAnswer = !revealed && result?.status !== 'pass'
    && (reviewOutcome ? reviewOutcome.graded && !reviewOutcome.passed : state.canReveal);

  return (
    <div className="space-y-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-dim">
        {ex.multi ? 'Select all that apply' : 'Choose one'}
        <span className="ml-2 normal-case tracking-normal">· keys 1–{Math.min(options.length, 9)} toggle options</span>
      </div>
      <div
        role="group"
        aria-label={ex.multi ? 'Options — select all that apply' : 'Options — choose one'}
        className="space-y-1.5"
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          const n = Number(e.key);
          if (Number.isInteger(n) && n >= 1 && n <= Math.min(options.length, 9)) {
            e.preventDefault();
            toggle(n - 1);
          }
        }}
      >
        {options.map((opt, i) => {
          const isAnswer = revealed?.answer.includes(i);
          return (
            <button
              key={`${round}-${i}`}
              onClick={() => toggle(i)}
              aria-pressed={selected.includes(i)}
              className={`flex w-full items-baseline rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                isAnswer ? 'border-pass bg-pass/10 text-paper'
                : selected.includes(i) ? 'border-amber bg-amber/10 text-paper'
                : 'border-line bg-panel hover:border-dim'
              }`}
            >
              <span className="mr-2 font-mono text-xs text-dim">{i + 1}</span>
              <span className="min-w-0 flex-1"><InlineCodeText text={opt} /></span>
              {isAnswer && <span className="ml-2 text-xs font-medium text-pass">✓ correct answer</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {locked
          ? <NextButton onNext={onNext} />
          : <SubmitButton busy={busy} disabled={selected.length === 0} onSubmit={submit} label="Check answer" />}
        {canShowAnswer && (
          <button onClick={reveal} className="rounded-md border border-line px-2.5 py-1.5 text-xs text-dim hover:text-paper">
            Show answer
          </button>
        )}
      </div>
      <div aria-live="polite" className="space-y-2">
        {notice && <p className="text-sm text-dim">{notice}</p>}
        {result && <QuizVerdict result={result} />}
        {revealed && <RevealNote explanation={revealed.explanation} drill={ex.drill} />}
        {note}
      </div>
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
  const blanks = !pass && result.total !== undefined && result.wrongBlanks;
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${pass ? 'border-pass/40 bg-pass/10' : 'border-fail/40 bg-fail/10'}`}>
      <span className={`font-medium ${pass ? 'text-pass' : 'text-fail'}`}>{pass ? 'Correct.' : 'Not quite — try again.'}</span>
      {blanks && <span className="ml-2 font-mono text-xs text-paper/80">{result.passed}/{result.total} blanks correct</span>}
      {pass && result.message && <div className="mt-1 text-paper/85"><InlineCodeText text={result.message} /></div>}
    </div>
  );
}

function RevealNote({ explanation, drill }: { explanation?: string; drill: boolean }) {
  return (
    <div className="rounded-md border border-sky/40 bg-sky/10 px-3 py-2 text-sm">
      <span className="font-medium text-sky">Answer shown.</span>{' '}
      <span className="text-paper/85">
        {drill ? 'Your streak was reset; answering now won’t count as a rep.' : 'Answering now won’t count toward completion — come back and get it on your own.'}
      </span>
      {explanation && <div className="mt-1 text-paper/85"><InlineCodeText text={explanation} /></div>}
    </div>
  );
}

// ---------- Fill in the blank ----------

function FillBlankBody({ ex, state, review, locked, reviewOutcome, onNext, onResponse, onState, note }: BodyProps & { note: React.ReactNode }) {
  const segments = useMemo(() => parseBlanks(ex.code ?? ''), [ex.code]);
  const blankKeys = segments.filter((s) => s.kind === 'blank').map((s) => (s as { key: string }).key);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ explanation?: string } | null>(null);
  const [busy, run] = useBusy();

  const submit = () => run(async () => {
    if (locked) return;
    try {
      const res = await api.submit(ex.id, { answers: values, review });
      setNotice(res.skipped ? res.message ?? null : null);
      if (res.result) setResult(res.result);
      if (!review && ex.drill && res.result?.status === 'pass') { setValues({}); setRevealed(null); }
      onResponse(res);
    } catch (e) {
      setNotice((e as Error).message);
    }
  });

  const reveal = async () => {
    try {
      const r = await api.reveal(ex.id);
      setValues(r.answers ?? {});
      setResult(null);
      setRevealed({ explanation: r.explanation });
      onState(r.state);
    } catch (e) {
      setNotice((e as Error).message);
    }
  };

  const wrong = new Set(result?.wrongBlanks ?? []);
  const allFilled = blankKeys.every((k) => (values[k] ?? '').trim().length > 0);
  const canShowAnswer = !revealed && result?.status !== 'pass'
    && (reviewOutcome ? reviewOutcome.graded && !reviewOutcome.passed : state.canReveal);
  let blankNo = 0;

  return (
    <div className="space-y-3">
      <pre className="overflow-x-auto rounded-lg border border-line bg-code p-3.5 font-mono text-[13px] leading-[1.9]">
        {segments.map((s, i) => {
          if (s.kind === 'text') return <span key={i}>{s.text}</span>;
          const n = ++blankNo;
          const cls = !result ? '' : result.status === 'pass' || !wrong.has(s.key) ? 'blank-good' : 'blank-bad';
          return (
            <input
              key={i}
              value={values[s.key] ?? ''}
              onChange={(e) => { setResult(null); setValues((v) => ({ ...v, [s.key]: e.target.value })); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && allFilled) submit(); }}
              size={Math.max(6, (values[s.key] ?? '').length + 1)}
              spellCheck={false}
              autoComplete="off"
              aria-label={`Blank ${n} of ${blankKeys.length}${result && result.status !== 'pass' && wrong.has(s.key) ? ' (incorrect)' : ''}`}
              className={`blank-input ${cls}`}
            />
          );
        })}
      </pre>
      <div className="flex flex-wrap items-center gap-3">
        {locked
          ? <NextButton onNext={onNext} />
          : <SubmitButton busy={busy} disabled={!allFilled} onSubmit={submit} label="Check answer" />}
        {canShowAnswer && (
          <button onClick={reveal} className="rounded-md border border-line px-2.5 py-1.5 text-xs text-dim hover:text-paper">
            Show answer
          </button>
        )}
      </div>
      <div aria-live="polite" className="space-y-2">
        {notice && <p className="text-sm text-dim">{notice}</p>}
        {result && <QuizVerdict result={result} />}
        {revealed && <RevealNote explanation={revealed.explanation} drill={ex.drill} />}
        {note}
      </div>
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

const draftKey = (id: string) => `javaprepare-draft:${id}`;
function readDraft(id: string): string | null {
  try { return localStorage.getItem(draftKey(id)); } catch { return null; }
}
function writeDraft(id: string, code: string | null) {
  try {
    if (code === null) localStorage.removeItem(draftKey(id));
    else localStorage.setItem(draftKey(id), code);
  } catch { /* storage unavailable */ }
}

function CodeBody({ ex, state, review, locked, onNext, onResponse, onState, rep, note }: BodyProps & { note: React.ReactNode }) {
  const starter = ex.starter ?? '';
  // Drafts are for regular exercises; drills and reviews always start from the starter (from memory).
  const persist = !review && !ex.drill;
  const [code, setCode] = useState(() => (persist && readDraft(ex.id)) || starter);
  const edited = useRef(false);
  const [result, setResult] = useState<{ result: GradeResult; examples: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<'grade' | 'run'>('grade');
  const [undo, setUndo] = useState<string | null>(null);
  const [busy, run] = useBusy();

  const lines = starter.split('\n').length;
  const height = Math.min(480, Math.max(starter.trim() ? 180 : 300, (lines + 6) * 21));

  // Fallback restore: last submitted code, if there's no local draft.
  useEffect(() => {
    if (!persist || readDraft(ex.id) !== null) return;
    let cancelled = false;
    api.lastCode(ex.id)
      .then(({ code: last }) => { if (!cancelled && last && !edited.current) setCode(last); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [ex.id, persist]);

  // Debounced draft save.
  useEffect(() => {
    if (!persist) return;
    const t = setTimeout(() => writeDraft(ex.id, code === starter ? null : code), 400);
    return () => clearTimeout(t);
  }, [code, persist, ex.id, starter]);

  useEffect(() => {
    if (undo === null) return;
    const t = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(t);
  }, [undo]);

  const onChange = (v: string) => { edited.current = true; setCode(v); };

  const submit = () => run(async () => {
    if (locked) return;
    setMode('grade');
    setNotice(null);
    try {
      const res = await api.submit(ex.id, { code, review });
      if (res.skipped) setNotice(res.message ?? null);
      else if (res.result) setResult({ result: res.result, examples: false });
      if (!review && ex.drill && res.result?.status === 'pass') setCode(starter);
      onResponse(res);
    } catch (e) {
      setResult({ result: { status: 'error', message: (e as Error).message }, examples: false });
    }
  });

  const runExamples = () => run(async () => {
    setMode('run');
    setNotice(null);
    try {
      const res = await api.run(ex.id, code);
      if (res.skipped) setNotice(res.message ?? null);
      else if (res.result) setResult({ result: res.result, examples: true });
    } catch (e) {
      setResult({ result: { status: 'error', message: (e as Error).message }, examples: true });
    }
  });

  const reset = () => {
    if (code === starter) return;
    setUndo(code);
    setCode(starter);
    setResult(null);
  };

  const hasExamples = (ex.type === 'code-method' || ex.type === 'code-design') && (ex.visibleTests?.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      {ex.type === 'code-output' && ex.expectedOutput !== undefined && (
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-dim">Your program must print exactly</div>
          <pre className="rounded-md border border-line bg-code p-2.5 font-mono text-xs leading-relaxed">{ex.expectedOutput}</pre>
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
      <CodeEditor
        value={code}
        onChange={onChange}
        height={height}
        onCmdEnter={locked ? undefined : submit}
        markers={result?.result.status === 'compile-error' ? result.result.diagnostics : undefined}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {locked ? <NextButton onNext={onNext} /> : (
          <>
            <SubmitButton
              busy={busy} disabled={false} onSubmit={submit} label="Run & grade"
              busyLabel={mode === 'run' ? 'Running examples…' : 'Compiling & grading…'}
            />
            {hasExamples && (
              <button
                onClick={runExamples}
                disabled={busy}
                className="rounded-md border border-line px-2.5 py-1.5 text-xs text-paper/85 hover:border-dim disabled:opacity-40"
                title="Runs only the visible examples. Not graded and not counted as an attempt."
              >
                Run examples
              </button>
            )}
            <button
              onClick={reset}
              disabled={code === starter}
              className="rounded-md border border-line px-2.5 py-1.5 text-xs text-dim hover:text-paper disabled:opacity-40"
            >
              Reset code
            </button>
            {undo !== null && (
              <span className="text-xs text-dim" role="status">
                Code reset —{' '}
                <button onClick={() => { setCode(undo); setUndo(null); }} className="font-medium text-amber underline">
                  Undo
                </button>
              </span>
            )}
          </>
        )}
        <span className="ml-auto text-[11px] text-dim">
          <kbd className="font-mono">Ctrl</kbd>/<kbd className="font-mono">⌘</kbd> + <kbd className="font-mono">Enter</kbd> to run & grade
        </span>
      </div>
      <div aria-live="polite" className="space-y-2">
        {notice && <p className="text-sm text-dim">{notice}</p>}
        {result && <TestResults result={result.result} examplesOnly={result.examples} />}
        {note}
      </div>
      {!review && (
        <HintPanel
          key={rep}
          exerciseId={ex.id}
          hintCount={ex.hintCount ?? 0}
          hasSolution={!!ex.hasSolution}
          drill={ex.drill}
          state={state}
          onState={onState}
        />
      )}
    </div>
  );
}

function SubmitButton({ busy, disabled, onSubmit, label, busyLabel = 'Checking…' }: {
  busy: boolean; disabled: boolean; onSubmit: () => void; label: string; busyLabel?: string;
}) {
  return (
    <button
      onClick={onSubmit}
      disabled={busy || disabled}
      className="rounded-md bg-amber px-4 py-1.5 text-sm font-semibold text-on-amber transition-colors hover:bg-amber-deep disabled:cursor-not-allowed disabled:opacity-40"
    >
      {busy ? busyLabel : label}
    </button>
  );
}
