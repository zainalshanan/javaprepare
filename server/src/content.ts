import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Curriculum, Exercise, Lesson, LessonSection } from './types.ts';
import { optionOrder } from './shuffle.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CONTENT_DIR = path.resolve(__dirname, '../../content');

export interface NavItem { kind: 'lesson' | 'problem'; id: string; title: string; unitTitle: string }

export interface ContentStore {
  curriculum: Curriculum;
  lessons: Map<string, Lesson>;
  exercises: Map<string, Exercise>;
  /** exerciseId -> unitId (for progress rollups / review labels) */
  exerciseUnit: Map<string, string>;
  /** exerciseId -> lessonId ('' for problems) */
  exerciseLesson: Map<string, string>;
  /** flat course order of navigable pages (lessons + problems) for prev/next */
  navSequence: NavItem[];
  errors: string[];
}

/** prev/next around a navigable page, or null at the ends. */
export function navFor(store: ContentStore, kind: 'lesson' | 'problem', id: string): {
  prev: NavItem | null;
  next: NavItem | null;
} {
  const i = store.navSequence.findIndex((n) => n.kind === kind && n.id === id);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? store.navSequence[i - 1] : null,
    next: i < store.navSequence.length - 1 ? store.navSequence[i + 1] : null,
  };
}

function parseLessonMarkdown(md: string): LessonSection[] {
  const sections: LessonSection[] = [];
  let buf: string[] = [];
  const flush = () => {
    const text = buf.join('\n').trim();
    if (text) sections.push({ kind: 'markdown', markdown: text });
    buf = [];
  };
  for (const line of md.split('\n')) {
    const m = line.match(/^@exercise\s+(\S+)\s*$/);
    if (m) {
      flush();
      sections.push({ kind: 'exercise', exerciseId: m[1] });
    } else {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

export function loadContent(dir: string = CONTENT_DIR): ContentStore {
  const errors: string[] = [];
  const curriculum = JSON.parse(readFileSync(path.join(dir, 'curriculum.json'), 'utf8')) as Curriculum;
  const lessons = new Map<string, Lesson>();
  const exercises = new Map<string, Exercise>();
  const exerciseUnit = new Map<string, string>();
  const exerciseLesson = new Map<string, string>();
  const navSequence: NavItem[] = [];

  const addExercise = (ex: Exercise, unitId: string, lessonId: string, source: string) => {
    if (exercises.has(ex.id)) {
      errors.push(`Duplicate exercise id "${ex.id}" (${source})`);
      return;
    }
    exercises.set(ex.id, ex);
    exerciseUnit.set(ex.id, unitId);
    exerciseLesson.set(ex.id, lessonId);
  };

  for (const unit of curriculum.units) {
    const unitDir = path.join(dir, 'units', unit.id);
    for (const ref of unit.lessons) {
      const mdPath = path.join(unitDir, `${ref.id}.md`);
      const exPath = path.join(unitDir, `${ref.id}.json`);
      if (!existsSync(mdPath)) {
        errors.push(`Missing lesson file: units/${unit.id}/${ref.id}.md`);
        continue;
      }
      const sections = parseLessonMarkdown(readFileSync(mdPath, 'utf8'));
      lessons.set(ref.id, { id: ref.id, unitId: unit.id, title: ref.title, sections });
      navSequence.push({ kind: 'lesson', id: ref.id, title: ref.title, unitTitle: unit.title });
      if (existsSync(exPath)) {
        const list = JSON.parse(readFileSync(exPath, 'utf8')) as Exercise[];
        for (const ex of list) addExercise(ex, unit.id, ref.id, `units/${unit.id}/${ref.id}.json`);
      }
      // referential check: every @exercise in the lesson must exist after unit load (checked below)
    }
    for (const problemId of unit.problems ?? []) {
      const file = findProblemFile(dir, problemId);
      if (!file) {
        errors.push(`Missing problem file for "${problemId}" (unit ${unit.id})`);
        continue;
      }
      const ex = JSON.parse(readFileSync(file, 'utf8')) as Exercise;
      if (ex.id !== problemId) errors.push(`Problem file ${file} has id "${ex.id}" but curriculum references "${problemId}"`);
      addExercise(ex, unit.id, '', file);
      navSequence.push({ kind: 'problem', id: problemId, title: ex.title, unitTitle: unit.title });
    }
  }

  // Validate @exercise references
  for (const lesson of lessons.values()) {
    for (const s of lesson.sections) {
      if (s.kind === 'exercise' && !exercises.has(s.exerciseId)) {
        errors.push(`Lesson "${lesson.id}" references unknown exercise "${s.exerciseId}"`);
      }
    }
  }

  return { curriculum, lessons, exercises, exerciseUnit, exerciseLesson, navSequence, errors };
}

const problemFileCache = new Map<string, string>();
function findProblemFile(dir: string, id: string): string | null {
  if (problemFileCache.size === 0) {
    const probDir = path.join(dir, 'problems');
    if (existsSync(probDir)) {
      for (const cat of readdirSync(probDir)) {
        const catDir = path.join(probDir, cat);
        for (const f of readdirSync(catDir)) {
          if (f.endsWith('.json')) problemFileCache.set(f.replace(/\.json$/, ''), path.join(catDir, f));
        }
      }
    }
  }
  return problemFileCache.get(id) ?? null;
}

/** Strip answers/solutions/hidden-test details before sending to the client. */
export function mcqOptions(ex: Extract<Exercise, { type: 'mcq' }>, round = 0): string[] {
  return optionOrder(ex.id, ex.options.length, round).map((i) => ex.options[i]);
}

export function sanitizeExercise(ex: Exercise, round = 0): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: ex.id, title: ex.title, type: ex.type, prompt: ex.prompt,
    drill: ex.drill ?? false, drillTarget: ex.drillTarget ?? 3,
  };
  switch (ex.type) {
    case 'mcq':
      return { ...base, options: mcqOptions(ex, round), round, multi: Array.isArray(ex.answer) };
    case 'fill-blank':
      return { ...base, code: ex.code };
    case 'code-output':
      return { ...base, starter: ex.starter, expectedOutput: ex.expectedOutput, stdin: ex.stdin, hintCount: ex.hints?.length ?? 0, hasSolution: !!ex.solution };
    case 'code-method':
      return {
        ...base, starter: ex.starter, difficulty: ex.difficulty, leetcodeUrl: ex.leetcodeUrl,
        hintCount: ex.hints?.length ?? 0, hasSolution: !!ex.solution,
        visibleTests: ex.tests.filter((t) => !t.hidden).map((t) => ({
          input: ex.method.params.map((p, i) => `${p.name} = ${JSON.stringify(t.args[i])}`).join(', '),
          expected: JSON.stringify(t.expected),
          note: t.note,
        })),
        hiddenTestCount: ex.tests.filter((t) => t.hidden).length,
      };
    case 'code-design':
      return {
        ...base, starter: ex.starter, difficulty: ex.difficulty, leetcodeUrl: ex.leetcodeUrl,
        hintCount: ex.hints?.length ?? 0, hasSolution: !!ex.solution,
        visibleTests: ex.tests.filter((t) => !t.hidden).map((t) => ({
          input: `ops = ${JSON.stringify(t.ops)}\nargs = ${JSON.stringify(t.args)}`,
          expected: JSON.stringify(t.expected),
          note: t.note,
        })),
        hiddenTestCount: ex.tests.filter((t) => t.hidden).length,
      };
  }
}
