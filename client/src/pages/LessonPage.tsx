import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api';
import type { ExerciseView, LessonView } from '../types';
import { ExerciseCard } from '../components/Exercise';
import { Markdown } from '../components/Markdown';
import { PageNav } from '../components/PageNav';
import { Pips } from '../components/Pips';

type Progress = 'done' | 'in-progress' | 'not-started';

function progressOf(e: ExerciseView): Progress {
  const s = e.state;
  if (s.status === 'completed' || s.status === 'mastered') return 'done';
  return s.consecutive > 0 || s.attempts > 0 ? 'in-progress' : 'not-started';
}

function scrollToExercise(id: string) {
  const el = document.getElementById(`ex-${id}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el?.querySelector<HTMLElement>('button, input, textarea')?.focus({ preventScroll: true });
}

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { hash } = useLocation();
  const [lesson, setLesson] = useState<LessonView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLesson(null);
    let cancelled = false;
    api.lesson(id!).then((l) => {
      if (cancelled) return;
      setLesson(l);
      if (hash.startsWith('#ex-')) requestAnimationFrame(() => scrollToExercise(hash.slice(4)));
      else window.scrollTo(0, 0);
    }).catch((e) => setError(e.message));
    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="text-fail">{error}</p>;
  if (!lesson) return <p className="text-dim">Loading lesson…</p>;

  const ordered = lesson.sections
    .flatMap((s) => (s.kind === 'exercise' && lesson.exercises[s.exerciseId] ? [lesson.exercises[s.exerciseId]] : []));
  const doneCount = ordered.filter((e) => progressOf(e) === 'done').length;
  const nextIncomplete = ordered.find((e) => progressOf(e) !== 'done');
  const hasDrills = ordered.some((e) => e.drill);

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 flex items-center gap-2 text-xs text-dim">
        <Link to="/" className="hover:text-paper">Course</Link>
        <span aria-hidden="true">/</span>
        <span>{lesson.unitTitle}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold tracking-tight">{lesson.title}</h1>

      {ordered.length > 0 && (
        <details className="mt-3 rounded-lg border border-line bg-panel/50" open={doneCount < ordered.length}>
          <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs">
            <span className="font-medium text-paper/90">{doneCount}/{ordered.length} exercises completed</span>
            {nextIncomplete ? (
              <button
                onClick={(e) => { e.preventDefault(); scrollToExercise(nextIncomplete.id); }}
                className="ml-auto rounded-md border border-amber/40 px-2 py-0.5 font-medium text-amber hover:bg-amber/10"
              >
                Next incomplete →
              </button>
            ) : <span className="ml-auto font-medium text-pass">Lesson complete ✓</span>}
          </summary>
          <div className="border-t border-line/60 px-3 py-2">
            <p className="mb-2 text-[11px] text-dim">
              The lesson is complete when every exercise is done.
              {hasDrills && ' Drills count once mastered — correct several times in a row, typed from memory.'}
            </p>
            <ol className="space-y-0.5">
              {ordered.map((e) => {
                const p = progressOf(e);
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => scrollToExercise(e.id)}
                      className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-panel-2"
                    >
                      <span aria-hidden="true" className={`w-4 text-center ${p === 'done' ? 'text-pass' : p === 'in-progress' ? 'text-amber' : 'text-dim'}`}>
                        {p === 'done' ? '✓' : p === 'in-progress' ? '◐' : '○'}
                      </span>
                      <span className="sr-only">{p === 'done' ? 'Done:' : p === 'in-progress' ? 'In progress:' : 'Not started:'}</span>
                      <span className={p === 'done' ? 'text-dim' : 'text-paper/90'}>{e.title}</span>
                      {e.state.withHelp && <span className="text-[10px] text-amber">with help</span>}
                      {e.drill && (
                        <span className="ml-auto">
                          <Pips size="sm" consecutive={e.state.consecutive} target={e.drillTarget} mastered={e.state.status === 'mastered'} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </details>
      )}

      <div className="mt-6 space-y-6">
        {lesson.sections.map((s, i) =>
          s.kind === 'markdown' ? (
            <Markdown key={i}>{s.markdown}</Markdown>
          ) : lesson.exercises[s.exerciseId] ? (
            <ExerciseCard
              key={s.exerciseId}
              ex={lesson.exercises[s.exerciseId]}
              onStateChange={(newState) => {
                setLesson((cur) => cur && {
                  ...cur,
                  exercises: { ...cur.exercises, [s.exerciseId]: { ...cur.exercises[s.exerciseId], state: newState } },
                });
              }}
            />
          ) : null,
        )}
      </div>
      <PageNav nav={lesson.nav} />
    </div>
  );
}
