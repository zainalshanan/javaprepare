import { Router } from 'express';
import type { ContentStore } from './content.ts';
import { navFor, sanitizeExercise } from './content.ts';
import type { Db } from './db.ts';
import { checkJdk } from './java/runner.ts';
import { gradeCodeDesign, gradeCodeMethod, gradeCodeOutput } from './java/grade.ts';
import { gradeFillBlank, gradeMcq } from './grading/quiz.ts';
import { initialSrs, reviewSrs } from './srs.ts';
import type { Exercise, GradeResult } from './types.ts';

export function createRouter(content: ContentStore, db: Db): Router {
  const r = Router();

  r.get('/doctor', async (_req, res) => {
    res.json(await checkJdk());
  });

  r.get('/course', (_req, res) => {
    const states = Object.fromEntries(db.allStates().map((s) => [s.exercise_id, {
      status: s.status, consecutive: s.consecutive, attempts: s.attempts,
    }]));
    const dueCount = db.dueReviews(new Date().toISOString()).length;
    const units = content.curriculum.units.map((u) => ({
      id: u.id,
      title: u.title,
      description: u.description,
      lessons: u.lessons.map((l) => {
        const lesson = content.lessons.get(l.id);
        const exerciseIds = lesson
          ? lesson.sections.filter((s) => s.kind === 'exercise').map((s) => (s as { exerciseId: string }).exerciseId)
          : [];
        return { id: l.id, title: l.title, exerciseIds };
      }),
      problems: (u.problems ?? []).map((pid) => {
        const ex = content.exercises.get(pid);
        return ex
          ? { id: pid, title: ex.title, difficulty: (ex as { difficulty?: string }).difficulty ?? null }
          : { id: pid, title: pid, difficulty: null };
      }),
    }));
    res.json({ title: content.curriculum.title, units, states, dueCount });
  });

  r.get('/lesson/:id', (req, res) => {
    const lesson = content.lessons.get(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'lesson not found' });
    const exercises: Record<string, unknown> = {};
    for (const s of lesson.sections) {
      if (s.kind === 'exercise') {
        const ex = content.exercises.get(s.exerciseId);
        if (ex) exercises[s.exerciseId] = { ...sanitizeExercise(ex), state: publicState(db, s.exerciseId) };
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
    const isProblem = content.exerciseLesson.get(ex.id) === '';
    res.json({
      ...sanitizeExercise(ex), unitId, unitTitle: unit?.title, state: publicState(db, ex.id),
      nav: isProblem ? navFor(content, 'problem', ex.id) : { prev: null, next: null },
    });
  });

  r.post('/submit/:id', async (req, res) => {
    const ex = content.exercises.get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    const { code, answer, answers, review } = req.body as {
      code?: string; answer?: number | number[]; answers?: Record<string, string>; review?: boolean;
    };

    let result: GradeResult;
    try {
      result = await grade(ex, { code, answer, answers });
    } catch (e) {
      return res.status(500).json({ error: `Grading failed: ${(e as Error).message}` });
    }

    const passed = result.status === 'pass';
    db.recordAttempt(ex.id, passed, code ?? null, !!review);
    const state = updateState(db, ex, passed, !!review);
    res.json({ result, state });
  });

  r.post('/hint/:id', (req, res) => {
    const ex = content.exercises.get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    const hints = 'hints' in ex ? ex.hints ?? [] : [];
    const index = (req.body as { index: number }).index ?? 0;
    if (index < 0 || index >= hints.length) return res.status(400).json({ error: 'no such hint' });
    const s = db.getState(ex.id) ?? freshState(ex.id);
    s.hints_used = Math.max(s.hints_used, index + 1);
    db.upsertState(s);
    res.json({ hint: hints[index], index });
  });

  r.post('/solution/:id', (req, res) => {
    const ex = content.exercises.get(req.params.id);
    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    const solution = 'solution' in ex ? ex.solution : undefined;
    if (!solution) return res.status(404).json({ error: 'no solution available' });
    const s = db.getState(ex.id) ?? freshState(ex.id);
    if (s.attempts === 0) {
      return res.status(403).json({ error: 'Make at least one attempt before viewing the solution.' });
    }
    s.solution_viewed = 1;
    db.upsertState(s);
    res.json({ solution });
  });

  r.get('/review', (_req, res) => {
    const due = db.dueReviews(new Date().toISOString());
    const items = due
      .map((d) => {
        const ex = content.exercises.get(d.exercise_id);
        if (!ex) return null;
        const unitId = content.exerciseUnit.get(ex.id);
        const unit = content.curriculum.units.find((u) => u.id === unitId);
        return {
          exerciseId: ex.id, title: ex.title, type: ex.type,
          unitTitle: unit?.title ?? '', dueAt: d.due_at,
          intervalDays: d.interval_days, lessonId: content.exerciseLesson.get(ex.id) || null,
        };
      })
      .filter(Boolean);
    res.json({ items });
  });

  r.get('/dashboard', (_req, res) => {
    const states = db.allStates();
    const stats = db.attemptStats();
    const statsById = new Map(stats.map((s) => [s.exercise_id, s]));
    const activity = db.activity(120);

    const units = content.curriculum.units.map((u) => {
      const ids: string[] = [];
      for (const l of u.lessons) {
        const lesson = content.lessons.get(l.id);
        if (lesson) for (const s of lesson.sections) if (s.kind === 'exercise') ids.push((s as { exerciseId: string }).exerciseId);
      }
      ids.push(...(u.problems ?? []));
      const done = ids.filter((id) => {
        const st = states.find((s) => s.exercise_id === id);
        return st && (st.status === 'completed' || st.status === 'mastered');
      }).length;
      let attempts = 0, passes = 0;
      for (const id of ids) {
        const st = statsById.get(id);
        if (st) { attempts += st.total; passes += st.passed; }
      }
      return {
        id: u.id, title: u.title, total: ids.length, done,
        passRate: attempts > 0 ? passes / attempts : null,
      };
    });

    // streak: consecutive days with a submission, ending today or yesterday
    const days = new Set(activity.map((a) => a.day));
    let streak = 0;
    const d = new Date();
    if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
    while (days.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    res.json({
      units,
      activity,
      streak,
      dueCount: db.dueReviews(new Date().toISOString()).length,
      mastered: states.filter((s) => s.status === 'mastered').length,
      completed: states.filter((s) => s.status === 'completed' || s.status === 'mastered').length,
      totalExercises: content.exercises.size,
    });
  });

  return r;
}

function freshState(id: string) {
  return { exercise_id: id, status: 'in-progress' as const, consecutive: 0, attempts: 0, hints_used: 0, solution_viewed: 0 };
}

function publicState(db: Db, id: string) {
  const s = db.getState(id);
  return s
    ? { status: s.status, consecutive: s.consecutive, attempts: s.attempts, hintsUsed: s.hints_used, solutionViewed: !!s.solution_viewed }
    : { status: 'not-started', consecutive: 0, attempts: 0, hintsUsed: 0, solutionViewed: false };
}

async function grade(
  ex: Exercise,
  sub: { code?: string; answer?: number | number[]; answers?: Record<string, string> },
): Promise<GradeResult> {
  switch (ex.type) {
    case 'mcq':
      if (sub.answer === undefined) throw new Error('missing answer');
      return gradeMcq(ex, sub.answer);
    case 'fill-blank':
      return gradeFillBlank(ex, sub.answers ?? {});
    case 'code-output':
      if (!sub.code?.trim()) return { status: 'fail', message: 'Submit some code first.' };
      return gradeCodeOutput(ex, sub.code);
    case 'code-method':
      if (!sub.code?.trim()) return { status: 'fail', message: 'Submit some code first.' };
      return gradeCodeMethod(ex, sub.code);
    case 'code-design':
      if (!sub.code?.trim()) return { status: 'fail', message: 'Submit some code first.' };
      return gradeCodeDesign(ex, sub.code);
  }
}

function updateState(db: Db, ex: Exercise, passed: boolean, isReview: boolean) {
  const s = db.getState(ex.id) ?? freshState(ex.id);
  s.attempts += 1;
  const isDrill = !!ex.drill;
  const target = ex.drillTarget ?? 3;

  if (isReview) {
    const srs = db.getSrs(ex.id) ?? initialSrs(ex.id);
    db.upsertSrs(reviewSrs(srs, passed));
    if (!passed && s.status === 'mastered') s.status = 'completed';
    if (passed && s.status !== 'mastered') s.status = 'mastered';
    db.upsertState(s);
    return { ...publicState(db, ex.id), mastered: passed };
  }

  if (isDrill) {
    if (passed) {
      s.consecutive += 1;
      if (s.consecutive >= target && s.status !== 'mastered') {
        s.status = 'mastered';
        if (!db.getSrs(ex.id)) db.upsertSrs(initialSrs(ex.id));
      }
    } else {
      s.consecutive = 0;
      if (s.status === 'mastered') s.status = 'completed';
    }
  } else if (passed && s.status !== 'mastered') {
    s.status = 'completed';
  }
  db.upsertState(s);
  return publicState(db, ex.id);
}
