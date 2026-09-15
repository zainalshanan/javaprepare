import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import type { ExerciseState, ExerciseView } from '../types';
import { ExerciseCard } from '../components/Exercise';
import { PageNav } from '../components/PageNav';

export function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  const [ex, setEx] = useState<ExerciseView | null>(null);
  const [state, setState] = useState<ExerciseState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEx(null);
    let cancelled = false;
    api.exercise(id!).then((e) => {
      if (cancelled) return;
      setEx(e);
      setState(e.state);
      window.scrollTo(0, 0);
    }).catch((e) => setError(e.message));
    return () => { cancelled = true; };
  }, [id]);

  if (error) return <p className="text-fail">{error}</p>;
  if (!ex || !state) return <p className="text-dim">Loading problem…</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-2 text-xs text-dim">
        <Link to="/" className="hover:text-paper">Course</Link>
        <span aria-hidden="true">/</span>
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
      <ExerciseCard key={ex.id} ex={ex} onStateChange={setState} />
      {!ex.drill && (state.status === 'completed' || state.status === 'mastered') && (
        <ReviewToggle id={ex.id} inReview={state.inReview} onState={setState} />
      )}
      <PageNav nav={ex.nav} />
    </div>
  );
}

function ReviewToggle({ id, inReview, onState }: { id: string; inReview: boolean; onState: (s: ExerciseState) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = async () => {
    setBusy(true);
    try {
      const res = await api.enroll(id, !inReview);
      onState(res.state);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel/50 px-4 py-2.5 text-sm">
      <span className="text-paper/85">
        {inReview
          ? 'This problem is in your review rotation — it comes back on a growing schedule, from the starter code.'
          : 'Want to be able to solve this cold in an interview? Add it to spaced review (first review in 3 days).'}
      </span>
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={inReview}
        className={`ml-auto rounded-md px-3 py-1 text-xs font-semibold disabled:opacity-40 ${
          inReview ? 'border border-line text-dim hover:text-paper' : 'bg-amber text-on-amber hover:bg-amber-deep'
        }`}
      >
        {inReview ? 'Remove from review' : 'Add to review'}
      </button>
      {error && <span className="w-full text-xs text-fail" role="alert">{error}</span>}
    </div>
  );
}
