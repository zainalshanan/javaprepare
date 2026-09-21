import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { ContentStore } from './content.ts';
import { openDb, type Db } from './db.ts';
import { createRouter } from './routes.ts';
import { optionOrder } from './shuffle.ts';
import type { Exercise } from './types.ts';

const exercises: Exercise[] = [
  { id: 'q-drill', title: 'Quiz drill', prompt: '', type: 'mcq', options: ['right', 'w1', 'w2', 'w3'], answer: 0, drill: true, drillTarget: 2 },
  { id: 'fill', title: 'Fill', prompt: '', type: 'fill-blank', code: 'int {{1}} = {{2}};', blanks: { 1: ['x'], 2: ['1'] } },
  { id: 'prog', title: 'Prog', prompt: '', type: 'code-output', starter: 'public class Main {}', expectedOutput: 'hi', hints: ['a', 'b'], solution: { code: 'x' } },
];

function store(): ContentStore {
  const map = new Map(exercises.map((e) => [e.id, e]));
  return {
    curriculum: { title: 'T', units: [{ id: 'u1', title: 'U1', description: '', lessons: [{ id: 'l1', title: 'L1' }] }] },
    lessons: new Map([['l1', { id: 'l1', unitId: 'u1', title: 'L1', sections: exercises.map((e) => ({ kind: 'exercise' as const, exerciseId: e.id })) }]]),
    exercises: map,
    exerciseUnit: new Map(exercises.map((e) => [e.id, 'u1'])),
    exerciseLesson: new Map(exercises.map((e) => [e.id, 'l1'])),
    navSequence: [],
    errors: [],
  };
}

let server: Server;
let base = '';
let db: Db;
let clock = new Date('2026-09-15T10:00:00Z');

beforeAll(async () => {
  db = openDb(':memory:');
  const app = express();
  app.use(express.json());
  app.use('/api', createRouter(store(), db, { now: () => clock, rng: () => 0.5 }));
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(() => server.close());

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', 'X-Timezone': 'UTC' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() as any };
}

/** Display index of the correct option for the current round. */
function correctDisplay(round: number) {
  return optionOrder('q-drill', 4, round).indexOf(0);
}

describe('routes', () => {
  it('empty submissions are not attempts', async () => {
    const r = await call('POST', '/submit/prog', { code: 'public class Main {}\n' });
    expect(r.body.skipped).toBe(true);
    expect(r.body.state.attempts).toBe(0);
    const q = await call('POST', '/submit/q-drill', { answer: [] });
    expect(q.body.skipped).toBe(true);
    expect((await call('GET', '/exercise/prog/last-code')).body.code).toBeNull();
  });

  it('solution is gated until 2 attempts or all hints', async () => {
    expect((await call('POST', '/solution/prog')).status).toBe(403);
    await call('POST', '/hint/prog', { index: 0 });
    expect((await call('POST', '/hint/prog', { index: 2 })).status).toBe(400);
    const h = await call('POST', '/hint/prog', { index: 1 });
    expect(h.body.state.solutionUnlocked).toBe(true);
    expect(h.body.state.revealedHints).toEqual(['a', 'b']);
    expect((await call('POST', '/solution/prog')).status).toBe(200);
  });

  it('fill-blank returns structured wrong blanks and reveals after 2 misses', async () => {
    const r = await call('POST', '/submit/fill', { answers: { 1: 'x', 2: '2' } });
    expect(r.body.result.wrongBlanks).toEqual(['2']);
    expect((await call('POST', '/reveal/fill')).status).toBe(403);
    await call('POST', '/submit/fill', { answers: { 1: 'y', 2: '2' } });
    const rev = await call('POST', '/reveal/fill');
    expect(rev.body.answers).toEqual({ 1: 'x', 2: '1' });
    const after = await call('POST', '/submit/fill', { answers: { 1: 'x', 2: '1' } });
    expect(after.body.result.status).toBe('pass');
    expect(after.body.counted).toBe(false);
    expect(after.body.state.status).toBe('in-progress');
  });

  it('drill mastery enrolls SRS, reshuffles, and review grades at most once per due period', async () => {
    let round = 0;
    for (let i = 0; i < 2; i++) {
      const r = await call('POST', '/submit/q-drill', { answer: correctDisplay(round), round });
      expect(r.body.drill.counted).toBe(true);
      round = r.body.state.round;
    }
    expect(round).toBe(2);
    let ex = await call('GET', '/exercise/q-drill');
    expect(ex.body.state.status).toBe('mastered');
    expect(ex.body.options).toEqual(optionOrder('q-drill', 4, 2).map((i) => ['right', 'w1', 'w2', 'w3'][i]));

    // Not due yet: a review-flagged submit is practice, schedule untouched.
    const early = await call('POST', '/submit/q-drill', { answer: correctDisplay(round), round, review: true });
    expect(early.body.review.graded).toBe(false);
    round = early.body.state.round;
    expect((await call('GET', '/review')).body.items).toHaveLength(0);

    clock = new Date('2026-09-16T08:00:00Z');
    expect((await call('GET', '/review/count')).body.dueCount).toBe(1);

    // First submit fails → graded lapse.
    const wrong = (correctDisplay(round) + 1) % 4;
    const fail = await call('POST', '/submit/q-drill', { answer: wrong, round, review: true });
    expect(fail.body.review).toMatchObject({ graded: true, passed: false, lapses: 1 });
    expect(fail.body.dueCount).toBe(0);
    round = fail.body.state.round;

    // Retry on the same card: practice, never turns the lapse into a pass.
    const retry = await call('POST', '/submit/q-drill', { answer: correctDisplay(round), round, review: true });
    expect(retry.body.result.status).toBe('pass');
    expect(retry.body.review.graded).toBe(false);

    ex = await call('GET', '/exercise/q-drill');
    expect(ex.body.state.status).toBe('completed'); // demoted by the lapse only
    const review = await call('GET', '/review');
    expect(review.body.nextDue).toEqual({ day: '2026-09-17', count: 1 });

    const dash = await call('GET', '/dashboard');
    expect(dash.body.retention).toEqual({ reviews: 1, passed: 0 });
    expect(dash.body.forecast[1]).toEqual({ day: '2026-09-17', count: 1 });
  });

  it('ignores progress rows for exercises that no longer exist', async () => {
    db.recordAttempt({ exerciseId: 'gone', passed: true, code: null, isReview: false, status: 'pass' });
    db.upsertSrs({ exercise_id: 'gone', ease: 2, interval_days: 1, due_at: '2020-01-01', reviews: 0, lapses: 9, last_reviewed_at: null });
    for (const p of ['/course', '/review', '/dashboard', '/review/count', '/lesson/l1']) {
      expect((await call('GET', p)).status).toBe(200);
    }
    expect((await call('GET', '/review')).body.items.map((i: { exerciseId: string }) => i.exerciseId)).not.toContain('gone');
    expect((await call('GET', '/dashboard')).body.leeches).toEqual([]);
  });
});
