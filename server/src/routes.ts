import { Router, type Request } from 'express';
import type { ContentStore } from './content.ts';
import { mcqOptions, navFor, sanitizeExercise } from './content.ts';
import type { Db, SrsState } from './db.ts';
import { checkJdk } from './java/runner.ts';
import { gradeCodeDesign, gradeCodeMethod, gradeCodeOutput } from './java/grade.ts';
import { gradeFillBlank, gradeMcq, mcqAnswerDisplay } from './grading/quiz.ts';
import {
  applyPractice, applyReviewToState, emptySubmissionMessage, freshState, HELP_HINT, HELP_REVEAL, HELP_SOLUTION,
  hintCountOf, REVEAL_AFTER_WRONG, solutionUnlocked, withHelp,
} from './progress.ts';
import { initialSrs, isDue, LEECH_LAPSES, reviewSrs } from './srs.ts';
import { addDays, daysBetween, localDay, parseDbTime, resolveTimeZone } from './time.ts';
import type { Exercise, GradeResult } from './types.ts';

/** Initial interval when a solved problem is enrolled into review. */
export const ENROLL_INTERVAL_DAYS = 3;

export function createRouter(
  content: ContentStore,
  db: Db,
  opts: { now?: () => Date; rng?: () => number } = {},
): Router {
  const r = Router();
  const now = opts.now ?? (() => new Date());
  const rng = opts.rng ?? Math.random;
  const tzOf = (req: Request) => resolveTimeZone(req.get('x-timezone'));
  const todayOf = (req: Request) => localDay(now(), tzOf(req));
  const known = (id: string) => content.exercises.has(id);
  const stateOf = (id: string) => db.getState(id) ?? freshState(id);
  const knownSrs = () => db.allSrs().filter((s) => known(s.exercise_id));
  const dueCount = (today: string) => knownSrs().filter((s) => isDue(s, today)).length;
  const isProblem = (id: string) => content.exerciseLesson.get(id) === '';
  const hrefOf = (id: string) => (isProblem(id) ? `/problem/${id}` : `/lesson/${content.exerciseLesson.get(id)}#ex-${id}`);
  const unitTitleOf = (id: string) => content.curriculum.units.find((u) => u.id === content.exerciseUnit.get(id))?.title ?? '';
  const lessonExerciseIds = (lessonId: string) =>
    (content.lessons.get(lessonId)?.sections ?? [])
      .flatMap((s) => (s.kind === 'exercise' && known(s.exerciseId) ? [s.exerciseId] : []));

  /** Client-facing progress view for one exercise. */
  const view = (ex: Exercise) => {
    const row = db.getState(ex.id);
    const s = row ?? freshState(ex.id);
    const hints = 'hints' in ex ? ex.hints ?? [] : [];
    return {
      status: row ? s.status : 'not-started',
      consecutive: s.consecutive,
      attempts: s.attempts,
      hintsUsed: s.hints_used,
      solutionViewed: !!s.solution_viewed,
      solutionUnlocked: solutionUnlocked(s, hints.length),
      withHelp: withHelp(s),
      repHelp: s.rep_help !== 0,
      canReveal: s.wrong_since_pass >= REVEAL_AFTER_WRONG,
      revealedHints: hints.slice(0, s.hints_used),
      inReview: !!db.getSrs(ex.id),
      round: s.shuffle_round,
    };
  };

  const exercisePayload = (ex: Exercise) => {
    const s = stateOf(ex.id);
    return { ...sanitizeExercise(ex, s.shuffle_round), state: view(ex) };
  };

  r.get('/doctor', async (_req, res) => {
    res.json(await checkJdk());
  });

  r.get('/course', (req, res) => {
    const states: Record<string, unknown> = {};
    for (const s of db.allStates()) {
      const ex = content.exercises.get(s.exercise_id);
      if (!ex) continue; // progress for removed exercises is kept but ignored
      states[s.exercise_id] = {
        status: s.status, consecutive: s.consecutive, attempts: s.attempts, withHelp: withHelp(s),
        drill: !!ex.drill, target: ex.drillTarget ?? 3,
      };
    }
    const units = content.curriculum.units.map((u) => ({
      id: u.id,
      title: u.title,
      description: u.description,
      lessons: u.lessons.map((l) => ({ id: l.id, title: l.title, exerciseIds: lessonExerciseIds(l.id) })),
      problems: (u.problems ?? []).map((pid) => {
        const ex = content.exercises.get(pid);
        return ex
          ? { id: pid, title: ex.title, difficulty: (ex as { difficulty?: string }).difficulty ?? null }
          : { id: pid, title: pid, difficulty: null };
      }),
    }));
    res.json({ title: content.curriculum.title, units, states, dueCount: dueCount(todayOf(req)) });
  });

  r.get('/lesson/:id', (req, res) => {
    const lesson = content.lessons.get(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'lesson not found' });
    const exercises: Record<string, unknown> = {};
    for (const s of lesson.sections) {
      if (s.kind === 'exercise') {
        const ex = content.exercises.get(s.exerciseId);
        if (ex) exercises[s.exerciseId] = exercisePayload(ex);
      }
    }
    const unit = content.curriculum.units.find((u) => u.id === lesson.unitId);
    res.json({ ...lesson, unitTitle: unit?.title, exercises, nav: navFor(content, 'lesson', lesson.id) });
  });

  r.get('/exercise/:id', (req, res) => {
    const ex = content.exercises.get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    const unitId = content.exerciseUnit.get(ex.id);
    const unit = content.curriculum.units.find((u) => u.id === unitId);
    const problem = isProblem(ex.id);
    res.json({
      ...exercisePayload(ex), unitId, unitTitle: unit?.title, isProblem: problem,
      lessonId: problem ? null : content.exerciseLesson.get(ex.id) ?? null,
      nav: problem ? navFor(content, 'problem', ex.id) : { prev: null, next: null },
    });
  });

  /** Last submitted code — fallback for draft restore. */
  r.get('/exercise/:id/last-code', (req, res) => {
    if (!known(req.params.id)) return res.status(404).json({ error: 'exercise not found' });
    res.json({ code: db.lastCode(req.params.id) });
  });

  r.post('/submit/:id', async (req, res) => {
    const ex = content.exercises.get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    const tz = tzOf(req);
    const body = (req.body ?? {}) as {
      code?: string; answer?: number | number[]; answers?: Record<string, string>; review?: boolean; round?: number;
    };

    const empty = emptySubmissionMessage(ex, body);
    if (empty) return res.json({ skipped: true, message: empty, state: view(ex), dueCount: dueCount(localDay(now(), tz)) });

    const round = validRound(body.round, stateOf(ex.id).shuffle_round);
    let result: GradeResult;
    try {
      result = await grade(ex, body, round);
    } catch (e) {
      return res.status(500).json({ error: `Grading failed: ${(e as Error).message}` });
    }

    // Everything below is synchronous, so the due check and SRS update can't interleave with another submit.
    const t = now();
    const today = localDay(t, tz);
    const nowIso = t.toISOString();
    const passed = result.status === 'pass';
    const srs = db.getSrs(ex.id);
    // Only a submit flagged as review, for an item that is actually due, with a real verdict, moves the schedule.
    const graded = shouldGradeReview(!!body.review, srs, today, result.status);
    let review: { graded: boolean; passed: boolean; intervalDays?: number; dueAt?: string; lapses?: number } | undefined;
    let drill: { counted: boolean; consecutive: number; target: number; justMastered: boolean } | undefined;
    let counted = false;

    db.tx(() => {
      const code = typeof body.code === 'string' && 'starter' in ex ? body.code : null;
      db.recordAttempt({
        exerciseId: ex.id, passed, code, isReview: graded, status: result.status,
        testsPassed: result.passed, testsTotal: result.total,
      });
      const prev = stateOf(ex.id);
      if (graded && srs) {
        const next = reviewSrs(srs, passed, t, tz, rng);
        db.upsertSrs(next);
        db.logSrs({
          exercise_id: ex.id, ts: nowIso, passed: passed ? 1 : 0,
          interval_before: srs.interval_days, interval_after: next.interval_days, ease_before: srs.ease, ease_after: next.ease,
        });
        db.upsertState(applyReviewToState(prev, ex, passed, nowIso));
        review = { graded: true, passed, intervalDays: next.interval_days, dueAt: next.due_at, lapses: next.lapses };
        counted = passed;
      } else {
        const o = applyPractice(prev, ex, result.status, nowIso);
        if (o.justMastered && !db.getSrs(ex.id)) db.upsertSrs(initialSrs(ex.id, today, 1));
        db.upsertState(o.state);
        counted = o.counted;
        if (ex.drill) {
          drill = { counted: o.counted, consecutive: o.state.consecutive, target: ex.drillTarget ?? 3, justMastered: o.justMastered };
        }
        if (body.review) review = { graded: false, passed };
      }
    });

    const state = view(ex);
    res.json({
      result, state, drill, review, counted,
      options: ex.type === 'mcq' ? mcqOptions(ex, state.round) : undefined,
      dueCount: dueCount(today),
    });
  });

  /** Runs only the visible example tests. Not an attempt; no progress changes. */
  r.post('/run/:id', async (req, res) => {
    const ex = content.exercises.get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    if (ex.type !== 'code-method' && ex.type !== 'code-design') return res.status(400).json({ error: 'only code-method / code-design exercises have examples' });
    const code = (req.body as { code?: string } | undefined)?.code;
    if (typeof code !== 'string' || !code.trim()) return res.json({ skipped: true, message: 'The editor is empty — write some code first.' });
    try {
      const result = ex.type === 'code-method'
        ? await gradeCodeMethod({ ...ex, tests: ex.tests.filter((t) => !t.hidden) }, code)
        : await gradeCodeDesign({ ...ex, tests: ex.tests.filter((t) => !t.hidden) }, code);
      res.json({ result });
    } catch (e) {
      res.status(500).json({ error: `Run failed: ${(e as Error).message}` });
    }
  });

  r.post('/hint/:id', (req, res) => {
    const ex = content.exercises.get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    const hints = 'hints' in ex ? ex.hints ?? [] : [];
    const index = Number((req.body as { index?: number } | undefined)?.index ?? 0);
    if (!Number.isInteger(index) || index < 0 || index >= hints.length) return res.status(400).json({ error: 'no such hint' });
    const s = stateOf(ex.id);
    if (index > s.hints_used) return res.status(400).json({ error: 'reveal the earlier hints first' });
    s.hints_used = Math.max(s.hints_used, index + 1);
    s.rep_help |= HELP_HINT;
    db.upsertState(s);
    res.json({ hint: hints[index], index, state: view(ex) });
  });

  r.post('/solution/:id', (req, res) => {
    const ex = content.exercises.get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    const solution = 'solution' in ex ? ex.solution : undefined;
    if (!solution) return res.status(404).json({ error: 'no solution available' });
    const s = stateOf(ex.id);
    if (!solutionUnlocked(s, hintCountOf(ex))) {
      return res.status(403).json({ error: 'The solution unlocks after 2 attempts, or once you have revealed every hint.' });
    }
    s.solution_viewed = 1;
    s.rep_help |= HELP_SOLUTION;
    db.upsertState(s);
    res.json({ solution, state: view(ex) });
  });

  /** "Show answer" for quizzes after repeated misses (or right after a failed review). */
  r.post('/reveal/:id', (req, res) => {
    const ex = content.exercises.get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    if (ex.type !== 'mcq' && ex.type !== 'fill-blank') return res.status(400).json({ error: 'only quizzes can reveal answers' });
    const tz = tzOf(req);
    const s = stateOf(ex.id);
    const srs = db.getSrs(ex.id);
    const failedReviewToday = !!srs?.last_reviewed_at
      && localDay(new Date(srs.last_reviewed_at), tz) === localDay(now(), tz)
      && db.lastSrsLog(ex.id)?.passed === 0;
    if (s.wrong_since_pass < REVEAL_AFTER_WRONG && !failedReviewToday) {
      return res.status(403).json({ error: 'Try a couple more times before revealing the answer.' });
    }
    const round = validRound((req.body as { round?: number } | undefined)?.round, s.shuffle_round);
    s.rep_help |= HELP_REVEAL;
    s.wrong_since_pass = 0;
    if (ex.drill) s.consecutive = 0;
    db.upsertState(s);
    if (ex.type === 'mcq') {
      res.json({ answer: mcqAnswerDisplay(ex, round), explanation: ex.explanation, state: view(ex) });
    } else {
      const answers = Object.fromEntries(Object.entries(ex.blanks).map(([k, v]) => [k, v[0] ?? '']));
      res.json({ answers, explanation: ex.explanation, state: view(ex) });
    }
  });

  r.get('/review/count', (req, res) => {
    res.json({ dueCount: dueCount(todayOf(req)) });
  });

  r.get('/review', (req, res) => {
    const today = todayOf(req);
    const all = knownSrs();
    const item = (s: SrsState) => {
      const ex = content.exercises.get(s.exercise_id)!;
      const dueDay = s.due_at.slice(0, 10);
      return {
        exerciseId: ex.id, title: ex.title, type: ex.type, drill: !!ex.drill,
        unitTitle: unitTitleOf(ex.id), dueAt: dueDay,
        overdueDays: Math.max(0, daysBetween(dueDay, today)),
        daysUntilDue: Math.max(0, daysBetween(today, dueDay)),
        intervalDays: s.interval_days, reviews: s.reviews, lapses: s.lapses, leech: s.lapses >= LEECH_LAPSES,
        lessonId: content.exerciseLesson.get(ex.id) || null, href: hrefOf(ex.id),
      };
    };
    const items = all.filter((s) => isDue(s, today)).map(item);
    const upcoming = all.filter((s) => !isDue(s, today));
    const nextDay = upcoming[0]?.due_at.slice(0, 10);
    res.json({
      today,
      items,
      ahead: upcoming.slice(0, 20).map(item),
      nextDue: nextDay ? { day: nextDay, count: upcoming.filter((s) => s.due_at.slice(0, 10) === nextDay).length } : null,
    });
  });

  /** Enroll / remove a solved problem in spaced review. */
  r.post('/review/enroll/:id', (req, res) => {
    const ex = content.exercises.get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    if (ex.drill) return res.status(400).json({ error: 'drills enter review automatically when mastered' });
    const enroll = !!(req.body as { enroll?: boolean } | undefined)?.enroll;
    const s = db.getState(ex.id);
    if (enroll) {
      if (!s || (s.status !== 'completed' && s.status !== 'mastered')) {
        return res.status(400).json({ error: 'Solve it first, then add it to review.' });
      }
      if (!db.getSrs(ex.id)) db.upsertSrs(initialSrs(ex.id, todayOf(req), ENROLL_INTERVAL_DAYS));
    } else {
      db.deleteSrs(ex.id);
    }
    res.json({ state: view(ex), dueCount: dueCount(todayOf(req)) });
  });

  r.get('/dashboard', (req, res) => {
    const tz = tzOf(req);
    const today = localDay(now(), tz);
    const states = db.allStates().filter((s) => known(s.exercise_id));
    const stateById = new Map(states.map((s) => [s.exercise_id, s]));
    const srsAll = knownSrs();
    const srsById = new Map(srsAll.map((s) => [s.exercise_id, s]));
    const attempts = db.allAttempts().filter((a) => known(a.exercise_id));

    // Activity + streak in the learner's local days, all history.
    const act = new Map<string, { submissions: number; passes: number }>();
    const attemptsByUnit = new Map<string, number>();
    for (const a of attempts) {
      const day = localDay(parseDbTime(a.created_at), tz);
      const cur = act.get(day) ?? { submissions: 0, passes: 0 };
      cur.submissions++;
      cur.passes += a.passed ? 1 : 0;
      act.set(day, cur);
      const unit = content.exerciseUnit.get(a.exercise_id) ?? '';
      attemptsByUnit.set(unit, (attemptsByUnit.get(unit) ?? 0) + 1);
    }
    const activity = [...act].map(([day, v]) => ({ day, ...v })).sort((a, b) => a.day.localeCompare(b.day));
    let streak = 0;
    let d = act.has(today) ? today : addDays(today, -1);
    while (act.has(d)) { streak++; d = addDays(d, -1); }

    const isDone = (id: string) => ['completed', 'mastered'].includes(stateById.get(id)?.status ?? '');
    const totals = { lessonDone: 0, lessonTotal: 0, drillsMastered: 0, drillsTotal: 0, problemsClean: 0, problemsHelp: 0, problemsTotal: 0 };

    const units = content.curriculum.units.map((u) => {
      const lessonIds = u.lessons.flatMap((l) => lessonExerciseIds(l.id));
      const drillIds = lessonIds.filter((id) => content.exercises.get(id)!.drill);
      const problemIds = (u.problems ?? []).filter(known);
      const solved = problemIds.filter(isDone);
      const withHelpN = solved.filter((id) => withHelp(stateById.get(id)!)).length;
      const lessonDone = lessonIds.filter(isDone).length;
      const drillsMastered = drillIds.filter((id) => stateById.get(id)?.status === 'mastered').length;
      totals.lessonDone += lessonDone; totals.lessonTotal += lessonIds.length;
      totals.drillsMastered += drillsMastered; totals.drillsTotal += drillIds.length;
      totals.problemsClean += solved.length - withHelpN; totals.problemsHelp += withHelpN; totals.problemsTotal += problemIds.length;

      // Struggle signal: review lapses + hint/solution reliance, per attempted exercise; needs ≥5 attempts.
      const ids = [...lessonIds, ...problemIds];
      const unitAttempts = attemptsByUnit.get(u.id) ?? 0;
      let lapses = 0, hinted = 0, solutions = 0, attempted = 0;
      for (const id of ids) {
        const s = stateById.get(id);
        if (s && s.attempts > 0) attempted++;
        if (s && s.hints_used > 0) hinted++;
        if (s?.solution_viewed) solutions++;
        lapses += srsById.get(id)?.lapses ?? 0;
      }
      const score = unitAttempts >= 5 && attempted > 0 ? (2 * lapses + hinted + 2 * solutions) / attempted : 0;

      return {
        id: u.id, title: u.title,
        total: ids.length, done: ids.filter(isDone).length,
        lessonExercises: { done: lessonDone, total: lessonIds.length },
        drills: { mastered: drillsMastered, total: drillIds.length },
        problems: { clean: solved.length - withHelpN, withHelp: withHelpN, total: problemIds.length },
        struggle: { score, lapses, hinted, solutions, attempts: unitAttempts },
      };
    });

    const forecast = Array.from({ length: 30 }, (_, i) => {
      const day = addDays(today, i);
      return { day, count: srsAll.filter((s) => (i === 0 ? isDue(s, today) : s.due_at.slice(0, 10) === day)).length };
    });

    const since = new Date(now().getTime() - 30 * 86_400_000).toISOString();
    const log = db.srsLogSince(since).filter((l) => known(l.exercise_id));
    const retention = { reviews: log.length, passed: log.filter((l) => l.passed).length };

    const leeches = srsAll
      .filter((s) => s.lapses >= LEECH_LAPSES)
      .sort((a, b) => b.lapses - a.lapses)
      .map((s) => ({ exerciseId: s.exercise_id, title: content.exercises.get(s.exercise_id)!.title, unitTitle: unitTitleOf(s.exercise_id), lapses: s.lapses, href: hrefOf(s.exercise_id) }));

    const weakAreas = units
      .filter((u) => u.struggle.score > 0)
      .sort((a, b) => b.struggle.score - a.struggle.score)
      .slice(0, 3)
      .map((u) => ({ id: u.id, title: u.title, ...u.struggle }));

    res.json({
      today, units, totals, activity, streak, forecast, retention, leeches, weakAreas,
      dueCount: srsAll.filter((s) => isDue(s, today)).length,
    });
  });

  return r;
}

/** A client-supplied MCQ round is honoured only if the server has issued it (0..current). */
export function validRound(round: unknown, current: number): number {
  return typeof round === 'number' && Number.isInteger(round) && round >= 0 && round <= current ? round : current;
}

export function shouldGradeReview(reviewFlag: boolean, srs: SrsState | undefined, today: string, status: GradeResult['status']): boolean {
  return reviewFlag && !!srs && isDue(srs, today) && status !== 'compile-error' && status !== 'error';
}

async function grade(
  ex: Exercise,
  sub: { code?: string; answer?: number | number[]; answers?: Record<string, string> },
  round: number,
): Promise<GradeResult> {
  switch (ex.type) {
    case 'mcq':
      if (sub.answer === undefined) throw new Error('missing answer');
      return gradeMcq(ex, sub.answer, round);
    case 'fill-blank':
      return gradeFillBlank(ex, sub.answers ?? {});
    case 'code-output':
      return gradeCodeOutput(ex, sub.code ?? '');
    case 'code-method':
      return gradeCodeMethod(ex, sub.code ?? '');
    case 'code-design':
      return gradeCodeDesign(ex, sub.code ?? '');
  }
}
