import type { SrsState } from './db.ts';
import { addDays, daysBetween, localDay } from './time.ts';

/**
 * SM-2-lite on local calendar days.
 * - Mastery (or enrolling a problem) schedules the first review 1 (or 3) days out.
 * - A pass multiplies the time actually elapsed since the last review (never less than
 *   the scheduled interval, so reviewing late earns credit) by ease, rounds to whole
 *   days, applies a small fuzz, and caps at MAX_INTERVAL.
 * - A miss (lapse) lowers ease and brings the item back tomorrow.
 * `due_at` holds a local day: an item is due from local midnight of that day.
 */
export const INITIAL_EASE = 2.2;
export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;
export const MAX_INTERVAL = 365;
export const LEECH_LAPSES = 4;

export function initialSrs(exerciseId: string, today: string, intervalDays = 1): SrsState {
  return {
    exercise_id: exerciseId,
    ease: INITIAL_EASE,
    interval_days: intervalDays,
    due_at: addDays(today, intervalDays),
    reviews: 0,
    lapses: 0,
    last_reviewed_at: null,
  };
}

/** Due from local midnight of the due day. Legacy ISO timestamps compare by their date part. */
export function isDue(srs: Pick<SrsState, 'due_at'>, today: string): boolean {
  return srs.due_at.slice(0, 10) <= today;
}

/** ±~5% whole-day fuzz; none for intervals ≤ 2 days, at least ±1 from 3 days. */
export function fuzzRange(interval: number): number {
  if (interval <= 2) return 0;
  return Math.max(1, Math.round(interval * 0.05));
}

export function applyFuzz(interval: number, rng: () => number = Math.random): number {
  const r = fuzzRange(interval);
  const delta = r === 0 ? 0 : Math.floor(rng() * (2 * r + 1)) - r;
  return Math.min(MAX_INTERVAL, Math.max(1, interval + delta));
}

export function reviewSrs(
  prev: SrsState,
  pass: boolean,
  now: Date,
  tz: string,
  rng: () => number = Math.random,
): SrsState {
  const today = localDay(now, tz);
  const base = { ...prev, reviews: prev.reviews + 1, last_reviewed_at: now.toISOString() };
  if (!pass) {
    return {
      ...base,
      ease: Math.max(MIN_EASE, prev.ease - 0.2),
      interval_days: 1,
      due_at: addDays(today, 1),
      lapses: prev.lapses + 1,
    };
  }
  // Without a previous review, count from when the item was scheduled (due day − interval).
  const lastDay = prev.last_reviewed_at
    ? localDay(new Date(prev.last_reviewed_at), tz)
    : addDays(prev.due_at.slice(0, 10), -Math.round(prev.interval_days));
  const elapsed = daysBetween(lastDay, today);
  const effective = Math.max(1, prev.interval_days, elapsed);
  const interval = applyFuzz(Math.min(MAX_INTERVAL, Math.round(effective * prev.ease)), rng);
  return {
    ...base,
    ease: Math.min(MAX_EASE, prev.ease + 0.05),
    interval_days: interval,
    due_at: addDays(today, interval),
  };
}
