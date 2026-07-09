import type { FillBlankExercise, GradeResult, McqExercise } from '../types.ts';
import { optionOrder } from '../shuffle.ts';

export function gradeMcq(ex: McqExercise, submitted: number | number[]): GradeResult {
  // The client submits DISPLAY indices (shuffled); map them back to originals.
  const order = optionOrder(ex.id, ex.options.length);
  const byNum = (a: number, b: number) => a - b;
  const want = (Array.isArray(ex.answer) ? [...ex.answer] : [ex.answer]).sort(byNum);
  const got = (Array.isArray(submitted) ? [...submitted] : [submitted])
    .map((d) => order[d])
    .sort(byNum);
  const pass = want.length === got.length && want.every((v, i) => v === got[i]);
  return {
    status: pass ? 'pass' : 'fail',
    message: pass ? ex.explanation : undefined,
  };
}

/** Java-aware token normalization: whitespace is flexible, code is not. */
export function normalizeBlank(s: string): string {
  return s
    .trim()
    // no space around punctuation/operators
    .replace(/\s*([(){}\[\];,.<>=+\-*/%!&|?:])\s*/g, '$1')
    // remaining runs of whitespace collapse to a single space
    .replace(/\s+/g, ' ');
}

export function gradeFillBlank(ex: FillBlankExercise, answers: Record<string, string>): GradeResult {
  const blanks = Object.keys(ex.blanks);
  const wrong: string[] = [];
  for (const key of blanks) {
    const got = normalizeBlank(answers[key] ?? '');
    const ok = ex.blanks[key].some((accepted) => normalizeBlank(accepted) === got);
    if (!ok) wrong.push(key);
  }
  const pass = wrong.length === 0;
  return {
    status: pass ? 'pass' : 'fail',
    message: pass
      ? ex.explanation
      : `Blank${wrong.length > 1 ? 's' : ''} ${wrong.join(', ')} ${wrong.length > 1 ? 'are' : 'is'} incorrect.`,
    passed: blanks.length - wrong.length,
    total: blanks.length,
  };
}
