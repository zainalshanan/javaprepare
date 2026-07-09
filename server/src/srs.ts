import type { SrsState } from './db.ts';

/**
 * SM-2-lite. Intervals: 1d on mastery, then interval * ease on each passed
 * review. A failed review resets to 1d and lowers ease.
 */
export const INITIAL_EASE = 2.2;
export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;

export function initialSrs(exerciseId: string, now = new Date()): SrsState {
  return {
    exercise_id: exerciseId,
    ease: INITIAL_EASE,
    interval_days: 1,
    due_at: addDays(now, 1),
    reviews: 0,
    lapses: 0,
  };
}

export function reviewSrs(prev: SrsState, pass: boolean, now = new Date()): SrsState {
  if (pass) {
    const interval = Math.min(120, Math.max(1, prev.interval_days) * prev.ease);
    return {
      ...prev,
      ease: Math.min(MAX_EASE, prev.ease + 0.05),
      interval_days: interval,
      due_at: addDays(now, interval),
      reviews: prev.reviews + 1,
    };
  }
  return {
    ...prev,
    ease: Math.max(MIN_EASE, prev.ease - 0.25),
    interval_days: 1,
    due_at: addDays(now, 1),
    reviews: prev.reviews + 1,
    lapses: prev.lapses + 1,
  };
}

function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}
