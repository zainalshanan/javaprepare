import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { ExerciseView, ReviewItem } from '../types';
import { ExerciseCard } from '../components/Exercise';

export function ReviewPage({ onCountChange }: { onCountChange: (n: number) => void }) {
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [active, setActive] = useState<ExerciseView | null>(null);
  const [finished, setFinished] = useState(0);

  const load = useCallback(() => {
    api.review().then((r) => {
      setItems(r.items);
      onCountChange(r.items.length);
    });
  }, [onCountChange]);

  useEffect(load, [load]);

  const start = (id: string) => {
    setActive(null);
    api.exercise(id).then(setActive);
  };

  if (!items) return <p className="text-dim">Loading review queue…</p>;

  if (active) {
    return (
      <div className="mx-auto max-w-3xl">
        <button onClick={() => { setActive(null); load(); }} className="mb-4 text-xs text-dim hover:text-paper">
          ← back to queue
        </button>
        <ExerciseCard
          ex={active}
          review
          onStateChange={() => setFinished((f) => f + 1)}
        />
        <p className="mt-3 text-xs text-dim">
          This is a spaced-repetition review: pass it and it comes back later on a longer interval; miss it and it returns tomorrow.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold tracking-tight">Review</h1>
      <p className="mt-1 text-sm text-dim">
        Mastered drills resurface here so the syntax stays automatic. {finished > 0 && `${finished} reviewed this session.`}
      </p>
      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-line bg-panel/50 px-6 py-10 text-center">
          <p className="font-display text-lg font-semibold">Nothing due</p>
          <p className="mt-1 text-sm text-dim">Master more drills in the course and they'll show up here on a schedule.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((it) => (
            <li key={it.exerciseId}>
              <button
                onClick={() => start(it.exerciseId)}
                className="flex w-full items-center gap-3 rounded-lg border border-line bg-panel/60 px-4 py-3 text-left hover:border-dim"
              >
                <div>
                  <div className="text-sm font-medium">{it.title}</div>
                  <div className="text-xs text-dim">{it.unitTitle}</div>
                </div>
                <span className="ml-auto font-mono text-[11px] text-amber">
                  due {new Date(it.dueAt).toLocaleDateString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
