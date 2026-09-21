import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { setDueCount } from '../reviewCount';
import type { ExerciseView, ReviewItem, ReviewQueue } from '../types';
import { ExerciseCard } from '../components/Exercise';

interface Outcome { id: string; passed: boolean; graded: boolean }
interface Session { mode: 'due' | 'ahead'; items: ReviewItem[]; index: number; outcomes: Outcome[] }

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

export function dayLabel(day: string, today?: string): string {
  if (today && day === today) return 'today';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function ReviewPage() {
  const [queue, setQueue] = useState<ReviewQueue | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [active, setActive] = useState<ExerciseView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const load = useCallback(() => {
    api.review().then((q) => { setQueue(q); setDueCount(q.items.length); }).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const current = session && session.index < session.items.length ? session.items[session.index] : null;

  // Load the current card; only the latest request may win.
  useEffect(() => {
    const mine = ++requestSeq.current;
    setActive(null);
    if (!current) return;
    api.exercise(current.exerciseId)
      .then((ex) => { if (mine === requestSeq.current) setActive(ex); })
      .catch((e) => { if (mine === requestSeq.current) setError(e.message); });
  }, [current?.exerciseId, session?.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Session finished → refresh queue for the summary's "next due".
  const finished = !!session && session.index >= session.items.length;
  useEffect(() => { if (finished) load(); }, [finished, load]);

  const start = (mode: Session['mode'], items: ReviewItem[], index = 0) => setSession({ mode, items, index, outcomes: [] });
  const advance = () => setSession((s) => s && { ...s, index: s.index + 1 });
  const record = (passed: boolean, graded: boolean) =>
    setSession((s) => {
      if (!s || !current || s.outcomes.some((o) => o.id === current.exerciseId)) return s;
      return { ...s, outcomes: [...s.outcomes, { id: current.exerciseId, passed, graded }] };
    });

  if (error) return <p className="text-fail">{error}</p>;
  if (!queue) return <p className="text-dim">Loading review queue…</p>;

  if (session && finished) {
    return <Summary session={session} queue={queue} onDone={() => setSession(null)} />;
  }

  if (session && current) {
    const pct = (session.index / session.items.length) * 100;
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center gap-3 text-xs text-dim">
          <button onClick={() => { setSession(null); load(); }} className="hover:text-paper">← End session</button>
          <span className="ml-auto font-mono" aria-live="polite">
            {session.mode === 'ahead' ? 'Reviewing ahead · ' : ''}{session.index + 1} of {session.items.length}
          </span>
        </div>
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className="h-full rounded-full bg-amber transition-all" style={{ width: `${pct}%` }} />
        </div>
        <WhyDue item={current} mode={session.mode} />
        {active ? (
          <ExerciseCard
            key={`${session.mode}-${active.id}`}
            ex={active}
            review
            onReviewGraded={(r) => record(r.passed, r.graded)}
            onNext={advance}
          />
        ) : <p className="text-dim">Loading…</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-dim">
          <span>
            {session.mode === 'ahead'
              ? 'Practice only — reviewing ahead never changes the schedule.'
              : 'Your first real answer is graded: pass and it comes back later on a longer interval; miss it and it returns tomorrow.'}
          </span>
          {!session.outcomes.some((o) => o.id === current.exerciseId) && (
            <button onClick={advance} className="ml-auto hover:text-paper">Skip for now →</button>
          )}
        </div>
      </div>
    );
  }

  const leeches = queue.items.filter((i) => i.leech).length;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold tracking-tight">Review</h1>
      <p className="mt-1 text-sm text-dim">
        Mastered drills and problems you’ve enrolled resurface here so they stay automatic.
      </p>
      {queue.items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-line bg-panel/50 px-6 py-10 text-center">
          <p className="font-display text-lg font-semibold">Nothing due</p>
          {queue.nextDue ? (
            <p className="mt-1 text-sm text-dim">
              Next due <span className="text-paper">{dayLabel(queue.nextDue.day)}</span> — {plural(queue.nextDue.count, 'item')}.
            </p>
          ) : (
            <p className="mt-1 text-sm text-dim">Master drills in the course (or add solved problems) and they’ll show up here on a schedule.</p>
          )}
          {queue.ahead.length > 0 && (
            <button
              onClick={() => start('ahead', queue.ahead)}
              className="mt-4 rounded-md border border-line px-3 py-1.5 text-sm text-paper/90 hover:border-dim"
            >
              Review ahead ({queue.ahead.length}) — practice only, schedule unchanged
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => start('due', queue.items)}
              className="rounded-md bg-amber px-4 py-2 text-sm font-semibold text-on-amber hover:bg-amber-deep"
            >
              Start review ({queue.items.length}) →
            </button>
            {leeches > 0 && (
              <span className="text-xs text-fail">{plural(leeches, 'leech')} — items you keep forgetting are flagged below</span>
            )}
          </div>
          <ul className="mt-5 space-y-2">
            {queue.items.map((it, i) => (
              <li key={it.exerciseId}>
                <button
                  onClick={() => start('due', queue.items, i)}
                  className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-panel/60 px-4 py-3 text-left hover:border-dim"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {it.title}
                      {it.leech && <LeechBadge />}
                    </div>
                    <div className="text-xs text-dim">{it.unitTitle}</div>
                  </div>
                  <span className="ml-auto font-mono text-[11px] text-amber">
                    {it.overdueDays > 0 ? `overdue ${plural(it.overdueDays, 'day')}` : 'due today'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function LeechBadge() {
  return (
    <span className="ml-2 rounded bg-fail/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fail" title="Lapsed 4+ times">
      leech
    </span>
  );
}

function WhyDue({ item, mode }: { item: ReviewItem; mode: Session['mode'] }) {
  const why = mode === 'ahead'
    ? `Due ${item.daysUntilDue > 0 ? `in ${plural(item.daysUntilDue, 'day')}` : 'soon'}`
    : item.overdueDays > 0 ? `Overdue by ${plural(item.overdueDays, 'day')}` : 'Due today';
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dim">
      <span className="font-medium text-paper/85">{why}</span>
      <span>interval {plural(Math.round(item.intervalDays), 'day')}</span>
      <span>{plural(item.reviews, 'review')}</span>
      <span className={item.lapses > 0 ? 'text-fail/90' : ''}>{plural(item.lapses, 'lapse')}</span>
      {item.leech && <LeechBadge />}
      <Link to={item.href} className="ml-auto text-sky hover:underline">
        Open {item.lessonId ? 'lesson' : 'problem'} ↗
      </Link>
    </div>
  );
}

function Summary({ session, queue, onDone }: { session: Session; queue: ReviewQueue; onDone: () => void }) {
  const graded = session.outcomes.filter((o) => o.graded);
  const passed = graded.filter((o) => o.passed).length;
  const lapsed = graded.length - passed;
  const practiced = session.outcomes.length - graded.length;
  const skipped = session.items.length - session.outcomes.length;
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-line bg-panel/60 px-6 py-8 text-center" aria-live="polite">
      <p className="font-display text-xl font-semibold">Session complete</p>
      <div className="mt-4 flex justify-center gap-6 text-sm">
        {session.mode === 'due' ? (
          <>
            <div><div className="font-display text-2xl font-bold text-pass">{passed}</div><div className="text-xs text-dim">passed</div></div>
            <div><div className="font-display text-2xl font-bold text-fail">{lapsed}</div><div className="text-xs text-dim">lapsed</div></div>
          </>
        ) : (
          <div><div className="font-display text-2xl font-bold">{practiced}</div><div className="text-xs text-dim">practiced</div></div>
        )}
        {skipped > 0 && <div><div className="font-display text-2xl font-bold text-dim">{skipped}</div><div className="text-xs text-dim">skipped</div></div>}
      </div>
      <p className="mt-4 text-sm text-dim">
        {queue.items.length > 0
          ? `${plural(queue.items.length, 'item')} still due today.`
          : queue.nextDue
            ? <>Next due <span className="text-paper">{dayLabel(queue.nextDue.day)}</span> — {plural(queue.nextDue.count, 'item')}.</>
            : 'Nothing scheduled yet.'}
      </p>
      <button onClick={onDone} className="mt-5 rounded-md bg-amber px-4 py-1.5 text-sm font-semibold text-on-amber hover:bg-amber-deep">
        Back to queue
      </button>
    </div>
  );
}
