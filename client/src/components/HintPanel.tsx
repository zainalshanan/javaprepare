import { useState } from 'react';
import { api } from '../api';
import { Markdown } from './Markdown';

export function HintPanel({ exerciseId, hintCount, hasSolution, attempts, initialHintsUsed }: {
  exerciseId: string;
  hintCount: number;
  hasSolution: boolean;
  attempts: number;
  initialHintsUsed: number;
}) {
  const [hints, setHints] = useState<string[]>([]);
  const [shown, setShown] = useState(0);
  const [solution, setSolution] = useState<{ code: string; explanation?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canSolution = hasSolution && attempts > 0;

  if (hintCount === 0 && !hasSolution) return null;

  const revealHint = async () => {
    try {
      const { hint } = await api.hint(exerciseId, shown);
      setHints((h) => [...h, hint]);
      setShown((s) => s + 1);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const revealSolution = async () => {
    try {
      const { solution } = await api.solution(exerciseId);
      setSolution(solution);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-2">
      {hints.map((h, i) => (
        <div key={i} className="rounded-md border border-amber/30 bg-amber/5 px-3 py-2 text-sm">
          <span className="mr-2 font-mono text-[11px] font-medium uppercase text-amber">hint {i + 1}</span>
          <span className="text-paper/90">{h}</span>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {shown < hintCount && (
          <button onClick={revealHint} className="rounded-md border border-amber/40 px-2.5 py-1 text-xs font-medium text-amber hover:bg-amber/10">
            {shown === 0 ? 'Get a hint' : `Next hint (${shown}/${hintCount} used)`}
          </button>
        )}
        {hasSolution && !solution && (
          <button
            onClick={revealSolution}
            disabled={!canSolution}
            title={canSolution ? undefined : 'Make at least one attempt first'}
            className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-dim hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            Show solution
          </button>
        )}
        {initialHintsUsed > 0 && shown === 0 && (
          <span className="text-[11px] text-dim">({initialHintsUsed} hint{initialHintsUsed > 1 ? 's' : ''} used previously)</span>
        )}
      </div>
      {error && <div className="text-xs text-fail">{error}</div>}
      {solution && (
        <div className="rounded-md border border-line bg-panel p-3">
          <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-pass">solution</div>
          <Markdown>{'```java\n' + solution.code.trim() + '\n```' + (solution.explanation ? '\n\n' + solution.explanation : '')}</Markdown>
        </div>
      )}
    </div>
  );
}
