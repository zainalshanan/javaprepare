import { useState } from 'react';
import { api } from '../api';
import type { ExerciseState } from '../types';
import { Markdown } from './Markdown';

export function HintPanel({ exerciseId, hintCount, hasSolution, drill, state, onState }: {
  exerciseId: string;
  hintCount: number;
  hasSolution: boolean;
  drill: boolean;
  state: ExerciseState;
  onState: (s: ExerciseState) => void;
}) {
  // Previously revealed hints are shown again — except on a fresh drill rep, which should be from memory.
  const [shown, setShown] = useState(() => (!drill || state.repHelp ? state.revealedHints.length : 0));
  const [solution, setSolution] = useState<{ code: string; explanation?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (hintCount === 0 && !hasSolution) return null;

  const revealHint = async () => {
    try {
      const res = await api.hint(exerciseId, shown);
      onState(res.state);
      setShown((s) => s + 1);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const revealSolution = async () => {
    try {
      const res = await api.solution(exerciseId);
      setSolution(res.solution);
      onState(res.state);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const hidden = state.hintsUsed - shown;
  return (
    <div className="space-y-2">
      {state.revealedHints.slice(0, shown).map((h, i) => (
        <div key={i} className="flex gap-2 rounded-md border border-amber/30 bg-amber/5 px-3 py-2 text-sm">
          <span className="mt-[3px] shrink-0 font-mono text-[11px] font-medium uppercase text-amber">hint {i + 1}</span>
          <div className="min-w-0 flex-1 [&_.prose-lesson]:text-sm [&_p]:my-0"><Markdown>{h}</Markdown></div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {shown < hintCount && (
          <button onClick={revealHint} className="rounded-md border border-amber/40 px-2.5 py-1 text-xs font-medium text-amber hover:bg-amber/10">
            {shown === 0 ? (hidden > 0 ? 'Show hint 1 again' : 'Get a hint') : `Next hint (${shown}/${hintCount} used)`}
          </button>
        )}
        {hasSolution && !solution && (
          <button
            onClick={revealSolution}
            disabled={!state.solutionUnlocked}
            className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-dim hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            View solution
          </button>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-dim">
        {hasSolution && !state.solutionUnlocked && (
          <>
            The solution unlocks after 2 attempts{hintCount > 0 ? ' or once you’ve revealed every hint' : ''}
            {' '}({Math.min(state.attempts, 2)}/2 attempts{hintCount > 0 ? `, ${state.hintsUsed}/${hintCount} hints` : ''}).{' '}
          </>
        )}
        {drill
          ? 'Using a hint or the solution means this rep won’t count toward your streak.'
          : 'Hints and the solution are always available later — solving after using them is marked “with help”.'}
        {drill && hidden > 0 && shown === 0 && ` (${state.hintsUsed} hint${state.hintsUsed > 1 ? 's' : ''} used on earlier reps.)`}
      </p>
      {error && <div className="text-xs text-fail" role="alert">{error}</div>}
      {solution && (
        <div className="rounded-md border border-line bg-panel p-3">
          <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-pass">solution</div>
          <Markdown>{'```java\n' + solution.code.trim() + '\n```' + (solution.explanation ? '\n\n' + solution.explanation : '')}</Markdown>
        </div>
      )}
    </div>
  );
}
