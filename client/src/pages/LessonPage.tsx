import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import type { LessonView } from '../types';
import { ExerciseCard } from '../components/Exercise';
import { Markdown } from '../components/Markdown';
import { PageNav } from '../components/PageNav';

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    setLesson(null);
    api.lesson(id!).then((l) => {
      setLesson(l);
      setDoneCount(Object.values(l.exercises).filter((e) => e.state.status === 'completed' || e.state.status === 'mastered').length);
      window.scrollTo(0, 0);
    }).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-fail">{error}</p>;
  if (!lesson) return <p className="text-dim">Loading lesson…</p>;

  const exerciseTotal = Object.keys(lesson.exercises).length;

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 flex items-center gap-2 text-xs text-dim">
        <Link to="/" className="hover:text-paper">Course</Link>
        <span>/</span>
        <span>{lesson.unitTitle}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold tracking-tight">{lesson.title}</h1>
      {exerciseTotal > 0 && (
        <p className="mt-1 text-xs text-dim">{doneCount}/{exerciseTotal} exercises completed</p>
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
                setLesson((cur) => {
                  if (!cur) return cur;
                  const next = { ...cur, exercises: { ...cur.exercises, [s.exerciseId]: { ...cur.exercises[s.exerciseId], state: newState } } };
                  setDoneCount(Object.values(next.exercises).filter((e) => e.state.status === 'completed' || e.state.status === 'mastered').length);
                  return next;
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
