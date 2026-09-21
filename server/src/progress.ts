import type { ExerciseState } from './db.ts';
import type { Exercise, GradeResult } from './types.ts';

/** rep_help bit flags: help used since the last pass. */
export const HELP_HINT = 1;
export const HELP_SOLUTION = 2;
export const HELP_REVEAL = 4;

export type GradeStatus = GradeResult['status'];

/** Wrong answers reset drill streaks; compile errors / grader errors are neutral. */
export const isWrong = (s: GradeStatus) => s === 'fail' || s === 'runtime-error' || s === 'timeout';

export function freshState(id: string): ExerciseState {
  return {
    exercise_id: id, status: 'in-progress', consecutive: 0, attempts: 0, hints_used: 0, solution_viewed: 0,
    completed_at: null, mastered_at: null, rep_help: 0, wrong_since_pass: 0, shuffle_round: 0, solved_with_help: null,
    updated_at: '',
  };
}

const normCode = (s: string) => s.replace(/\r\n/g, '\n').trim();

/** Blank or untouched submissions are not attempts. Returns a friendly message, or null if it's a real submission. */
export function emptySubmissionMessage(
  ex: Exercise,
  sub: { code?: unknown; answer?: unknown; answers?: unknown },
): string | null {
  switch (ex.type) {
    case 'mcq': {
      const a = sub.answer;
      if (a === undefined || a === null || (Array.isArray(a) && a.length === 0)) return 'Pick an answer first.';
      return null;
    }
    case 'fill-blank': {
      const answers = (sub.answers && typeof sub.answers === 'object' ? sub.answers : {}) as Record<string, unknown>;
      const any = Object.values(answers).some((v) => typeof v === 'string' && v.trim() !== '');
      return any ? null : 'Fill in the blanks first.';
    }
    default: {
      const code = typeof sub.code === 'string' ? normCode(sub.code) : '';
      if (!code) return 'The editor is empty — write some code first. (Not counted as an attempt.)';
      if (code === normCode(ex.starter)) return "That's still the starter code — make a change first. (Not counted as an attempt.)";
      return null;
    }
  }
}

export function hintCountOf(ex: Exercise): number {
  return 'hints' in ex ? ex.hints?.length ?? 0 : 0;
}

/** "View solution" unlocks after 2 real attempts, or once every hint has been revealed. */
export function solutionUnlocked(s: Pick<ExerciseState, 'attempts' | 'hints_used'>, hintCount: number): boolean {
  return s.attempts >= 2 || (hintCount > 0 && s.hints_used >= hintCount);
}

export const REVEAL_AFTER_WRONG = 2;

export interface PracticeOutcome {
  state: ExerciseState;
  /** Drill: the pass counted toward the streak. Non-drill: the pass gave completion credit. */
  counted: boolean;
  justMastered: boolean;
}

/** Applies a (non-review) graded submission to exercise state. */
export function applyPractice(prev: ExerciseState, ex: Pick<Exercise, 'drill' | 'drillTarget'>, status: GradeStatus, nowIso: string): PracticeOutcome {
  const s = { ...prev };
  if (status === 'error') return { state: s, counted: false, justMastered: false };
  s.attempts += 1;
  let counted = false;
  let justMastered = false;

  if (status === 'pass') {
    const helped = s.rep_help !== 0;
    if (ex.drill) {
      if (!helped) {
        counted = true;
        s.consecutive += 1;
        if (s.consecutive >= (ex.drillTarget ?? 3) && s.status !== 'mastered') {
          s.status = 'mastered';
          s.mastered_at ??= nowIso;
          markCompleted(s, nowIso);
          justMastered = true;
        }
      }
    } else if (!(s.rep_help & HELP_REVEAL)) {
      counted = true;
      if (s.status !== 'completed' && s.status !== 'mastered') s.status = 'completed';
      markCompleted(s, nowIso);
    }
    s.rep_help = 0;
    s.wrong_since_pass = 0;
    s.shuffle_round += 1;
  } else if (isWrong(status)) {
    // Only wrong answers reset the streak; a mastered drill is never demoted by practice.
    if (ex.drill) s.consecutive = 0;
    s.wrong_since_pass += 1;
  }
  return { state: s, counted, justMastered };
}

function markCompleted(s: ExerciseState, nowIso: string) {
  if (s.completed_at) return;
  s.completed_at = nowIso;
  s.solved_with_help = s.hints_used > 0 || s.solution_viewed ? 1 : 0;
}

/** Applies an SRS-graded review to exercise state. Only drills change mastery status. */
export function applyReviewToState(prev: ExerciseState, ex: Pick<Exercise, 'drill'>, passed: boolean, nowIso: string): ExerciseState {
  const s = { ...prev, attempts: prev.attempts + 1, rep_help: 0, shuffle_round: prev.shuffle_round + 1 };
  if (passed) {
    s.wrong_since_pass = 0;
    if (ex.drill && s.status !== 'mastered') { s.status = 'mastered'; s.mastered_at ??= nowIso; }
  } else {
    s.wrong_since_pass += 1;
    if (ex.drill) {
      // A lapse demotes and re-mastery needs a fresh clean streak.
      s.consecutive = 0;
      if (s.status === 'mastered') s.status = 'completed';
    }
  }
  return s;
}

export function withHelp(s: Pick<ExerciseState, 'status' | 'solved_with_help' | 'hints_used' | 'solution_viewed'>): boolean {
  if (s.status !== 'completed' && s.status !== 'mastered') return false;
  return s.solved_with_help === null ? s.hints_used > 0 || !!s.solution_viewed : !!s.solved_with_help;
}
