import { describe, expect, it } from 'vitest';
import {
  applyPractice, applyReviewToState, emptySubmissionMessage, freshState, HELP_HINT, HELP_REVEAL, HELP_SOLUTION,
  solutionUnlocked, withHelp,
} from './progress.ts';
import type { Exercise } from './types.ts';

const NOW = '2026-09-15T12:00:00.000Z';
const drill = { drill: true, drillTarget: 3 };
const plain = { drill: false };

describe('drill streak rules', () => {
  it('three clean passes master the drill', () => {
    let s = freshState('d');
    for (let i = 0; i < 3; i++) s = applyPractice(s, drill, 'pass', NOW).state;
    expect(s.status).toBe('mastered');
    expect(s.consecutive).toBe(3);
    expect(s.mastered_at).toBe(NOW);
  });

  it('only wrong answers reset; compile errors are neutral', () => {
    let s = applyPractice(freshState('d'), drill, 'pass', NOW).state;
    s = applyPractice(s, drill, 'compile-error', NOW).state;
    expect(s.consecutive).toBe(1);
    expect(s.attempts).toBe(2);
    for (const status of ['fail', 'runtime-error', 'timeout'] as const) {
      const r = applyPractice({ ...s, consecutive: 2 }, drill, status, NOW).state;
      expect(r.consecutive).toBe(0);
    }
    // grader errors aren't attempts at all
    expect(applyPractice(s, drill, 'error', NOW).state.attempts).toBe(2);
  });

  it('a pass after using help does not count, but does not reset', () => {
    for (const flag of [HELP_HINT, HELP_SOLUTION, HELP_REVEAL]) {
      const s = { ...freshState('d'), consecutive: 2, rep_help: flag };
      const o = applyPractice(s, drill, 'pass', NOW);
      expect(o.counted).toBe(false);
      expect(o.state.consecutive).toBe(2);
      expect(o.state.rep_help).toBe(0); // next rep is clean again
    }
  });

  it('missing a mastered drill in practice does not demote it', () => {
    const s = { ...freshState('d'), status: 'mastered' as const, consecutive: 3 };
    const r = applyPractice(s, drill, 'fail', NOW).state;
    expect(r.status).toBe('mastered');
  });

  it('only review lapses demote drills', () => {
    const s = { ...freshState('d'), status: 'mastered' as const };
    expect(applyReviewToState({ ...s, consecutive: 3 }, drill, false, NOW)).toMatchObject({ status: 'completed', consecutive: 0 });
    expect(applyReviewToState({ ...s, status: 'completed' }, drill, true, NOW).status).toBe('mastered');
    expect(applyReviewToState({ ...s, status: 'completed' }, plain, true, NOW).status).toBe('completed');
  });
});

describe('completion and help', () => {
  it('records solved with help at first completion', () => {
    const helped = applyPractice({ ...freshState('p'), hints_used: 1, rep_help: HELP_HINT }, plain, 'pass', NOW).state;
    expect(helped.status).toBe('completed');
    expect(withHelp(helped)).toBe(true);
    const clean = applyPractice(freshState('p'), plain, 'pass', NOW).state;
    expect(withHelp(clean)).toBe(false);
    // later hint use doesn't rewrite history
    expect(withHelp({ ...clean, hints_used: 2 })).toBe(false);
  });

  it('a quiz pass right after "Show answer" gives no completion credit', () => {
    const o = applyPractice({ ...freshState('q'), rep_help: HELP_REVEAL }, plain, 'pass', NOW);
    expect(o.counted).toBe(false);
    expect(o.state.status).toBe('in-progress');
  });

  it('solution unlocks after 2 attempts or all hints', () => {
    expect(solutionUnlocked({ attempts: 1, hints_used: 0 }, 2)).toBe(false);
    expect(solutionUnlocked({ attempts: 2, hints_used: 0 }, 2)).toBe(true);
    expect(solutionUnlocked({ attempts: 0, hints_used: 2 }, 2)).toBe(true);
    expect(solutionUnlocked({ attempts: 0, hints_used: 0 }, 0)).toBe(false);
  });

  it('counts wrong answers since the last pass and bumps the shuffle round on pass', () => {
    let s = applyPractice(freshState('q'), plain, 'fail', NOW).state;
    s = applyPractice(s, plain, 'fail', NOW).state;
    expect(s.wrong_since_pass).toBe(2);
    s = applyPractice(s, plain, 'pass', NOW).state;
    expect(s.wrong_since_pass).toBe(0);
    expect(s.shuffle_round).toBe(1);
  });
});

describe('empty submissions', () => {
  const code = { id: 'c', title: '', prompt: '', type: 'code-output', starter: 'class A {\n}\n', expectedOutput: '' } as Exercise;
  const mcq = { id: 'm', title: '', prompt: '', type: 'mcq', options: ['a', 'b'], answer: 0 } as Exercise;
  const fill = { id: 'f', title: '', prompt: '', type: 'fill-blank', code: '{{1}}', blanks: { 1: ['x'] } } as Exercise;

  it('rejects blank or starter-identical code', () => {
    expect(emptySubmissionMessage(code, { code: '   \n' })).toBeTruthy();
    expect(emptySubmissionMessage(code, {})).toBeTruthy();
    expect(emptySubmissionMessage(code, { code: '\r\nclass A {\r\n}  ' })).toBeTruthy();
    expect(emptySubmissionMessage(code, { code: 'class A { int x; }' })).toBeNull();
  });
  it('rejects empty quiz answers', () => {
    expect(emptySubmissionMessage(mcq, { answer: [] })).toBeTruthy();
    expect(emptySubmissionMessage(mcq, { answer: 0 })).toBeNull();
    expect(emptySubmissionMessage(fill, { answers: { 1: ' ' } })).toBeTruthy();
    expect(emptySubmissionMessage(fill, { answers: { 1: 'y' } })).toBeNull();
  });
});
