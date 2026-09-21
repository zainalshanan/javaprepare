import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Course, CourseState, CourseUnit } from '../types';
import { StatusDot } from '../components/Pips';

export function CourseMap() {
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.course().then(setCourse).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-fail">{error}</p>;
  if (!course) return <p className="text-dim">Loading course…</p>;

  const resume = firstIncomplete(course);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">{course.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-dim">
        Zero Java to interview-ready: fundamentals drilled to muscle memory, one reusable template per
        NeetCode category, then the real problems.
      </p>
      {resume && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to={resume.kind === 'lesson' ? `/lesson/${resume.id}` : `/problem/${resume.id}`}
            className="rounded-md bg-amber px-4 py-2 text-sm font-semibold text-on-amber hover:bg-amber-deep"
          >
            {resume.started ? 'Continue where you left off' : 'Start the course'} →
          </Link>
          <span className="text-xs text-dim">{resume.title}</span>
        </div>
      )}
      <div className="mt-6 space-y-4">
        {course.units.map((u, i) => (
          <UnitCard key={u.id} unit={u} index={i} course={course} />
        ))}
      </div>
    </div>
  );
}

function isDone(s?: { status: string }): boolean {
  return !!s && (s.status === 'completed' || s.status === 'mastered');
}

/** Started but not done: a drill part-way to its streak, or any attempt so far. */
function isPartial(s?: CourseState): boolean {
  return !!s && !isDone(s) && (s.consecutive > 0 || s.attempts > 0);
}

/** First lesson/problem in course order that isn't finished — powers the Continue button. */
function firstIncomplete(course: Course): { kind: 'lesson' | 'problem'; id: string; title: string; started: boolean } | null {
  let anyProgress = false;
  for (const u of course.units) {
    for (const l of u.lessons) {
      const total = l.exerciseIds.length;
      const done = l.exerciseIds.filter((id) => isDone(course.states[id])).length;
      if (done > 0 || l.exerciseIds.some((id) => isPartial(course.states[id]))) anyProgress = true;
      if (total > 0 && done < total) return { kind: 'lesson', id: l.id, title: `${l.title}`, started: anyProgress };
    }
    for (const p of u.problems) {
      if (isDone(course.states[p.id])) anyProgress = true;
      else return { kind: 'problem', id: p.id, title: p.title, started: anyProgress };
    }
  }
  return null;
}

function unitProgress(unit: CourseUnit, course: Course): { done: number; total: number } {
  const ids = [...unit.lessons.flatMap((l) => l.exerciseIds), ...unit.problems.map((p) => p.id)];
  return { done: ids.filter((id) => isDone(course.states[id])).length, total: ids.length };
}

function UnitCard({ unit, index, course }: { unit: CourseUnit; index: number; course: Course }) {
  const { done, total } = unitProgress(unit, course);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isPattern = unit.title.startsWith('Pattern:');

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-panel/50">
      <header className="flex items-center gap-4 px-5 py-3.5">
        <span className="font-mono text-xs font-medium text-dim">U{String(index).padStart(2, '0')}</span>
        <div className="min-w-0">
          <h2 className="truncate font-display text-[16px] font-semibold leading-tight">
            {isPattern ? (
              <>
                <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wider text-sky">pattern</span>
                {unit.title.replace('Pattern: ', '')}
              </>
            ) : unit.title}
          </h2>
          <p className="truncate text-xs text-dim">{unit.description}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full bg-amber transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="w-12 text-right font-mono text-[11px] text-dim">
            {done}/{total}<span className="sr-only"> done</span>
          </span>
        </div>
      </header>
      <div className="border-t border-line/60 px-5 py-3">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
          {unit.lessons.map((l) => {
            const doneCount = l.exerciseIds.filter((id) => isDone(course.states[id])).length;
            const partial = l.exerciseIds.filter((id) => isPartial(course.states[id])).length;
            const status = l.exerciseIds.length > 0 && doneCount === l.exerciseIds.length
              ? 'completed'
              : doneCount > 0 || partial > 0 ? 'in-progress' : 'not-started';
            return (
              <li key={l.id}>
                <Link to={`/lesson/${l.id}`} className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-panel-2">
                  <StatusDot status={status} />
                  <span className="text-paper/90 group-hover:text-paper">{l.title}</span>
                  {l.exerciseIds.length > 0 && (
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-dim">
                      {partial > 0 && <span className="mr-1.5 text-amber" title={`${partial} in progress`}>◐{partial}<span className="sr-only"> in progress,</span></span>}
                      {doneCount}/{l.exerciseIds.length}<span className="sr-only"> done</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        {unit.problems.length > 0 && (
          <div className="mt-2 border-t border-line/40 pt-2.5">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-dim">problems</div>
            <div className="flex flex-wrap gap-1.5">
              {unit.problems.map((p) => {
                const s = course.states[p.id];
                const solved = isDone(s);
                const helped = solved && s.withHelp;
                return (
                  <Link
                    key={p.id}
                    to={`/problem/${p.id}`}
                    title={helped ? 'Solved with help (hints or solution)' : solved ? 'Solved' : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                      helped ? 'border-amber/40 bg-amber/10 text-amber'
                      : solved ? 'border-pass/40 bg-pass/10 text-pass'
                      : isPartial(s) ? 'border-amber/30 bg-panel text-paper/85 hover:border-dim'
                      : 'border-line bg-panel text-paper/85 hover:border-dim'
                    }`}
                  >
                    {solved && <span aria-hidden="true">✓</span>}
                    {p.title}
                    {helped && <span className="text-[10px] opacity-80">help</span>}
                    <span className="sr-only">
                      {helped ? ' (solved with help)' : solved ? ' (solved)' : isPartial(s) ? ' (attempted)' : ''}
                    </span>
                    {p.difficulty && <Difficulty d={p.difficulty} />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Difficulty({ d }: { d: string }) {
  const cls = d === 'Easy' ? 'text-pass' : d === 'Medium' ? 'text-amber' : 'text-fail';
  return <span className={`text-[10px] font-medium ${cls}`} title={d}>{d[0]}<span className="sr-only">{d.slice(1)}</span></span>;
}
