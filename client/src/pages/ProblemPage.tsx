import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import type { ExerciseView } from '../types';
import { ExerciseCard } from '../components/Exercise';
import { PageNav } from '../components/PageNav';

export function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  const [ex, setEx] = useState<ExerciseView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEx(null);
    api.exercise(id!).then((e) => { setEx(e); window.scrollTo(0, 0); }).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-fail">{error}</p>;
  if (!ex) return <p className="text-dim">Loading problem…</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-2 text-xs text-dim">
        <Link to="/" className="hover:text-paper">Course</Link>
        <span>/</span>
        <span>{ex.unitTitle}</span>
        {ex.difficulty && (
          <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            ex.difficulty === 'Easy' ? 'bg-pass/15 text-pass' : ex.difficulty === 'Medium' ? 'bg-amber/15 text-amber' : 'bg-fail/15 text-fail'
          }`}>{ex.difficulty}</span>
        )}
        {ex.leetcodeUrl && (
          <a href={ex.leetcodeUrl} target="_blank" rel="noreferrer" className="ml-auto text-sky hover:underline">
            open on LeetCode ↗
          </a>
        )}
      </nav>
      <ExerciseCard ex={ex} />
      <PageNav nav={ex.nav} />
    </div>
  );
}
