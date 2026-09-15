export interface ExerciseState {
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered';
  consecutive: number;
  attempts: number;
  hintsUsed: number;
  solutionViewed: boolean;
  solutionUnlocked: boolean;
  withHelp: boolean;
  /** Help (hint / solution / reveal) used since the last pass. */
  repHelp: boolean;
  /** Quiz: enough wrong answers to offer "Show answer". */
  canReveal: boolean;
  revealedHints: string[];
  inReview: boolean;
  round: number;
}

export interface VisibleTest { input: string; expected: string; note?: string }

export interface NavItem { kind: 'lesson' | 'problem'; id: string; title: string; unitTitle: string }
export interface PageNav { prev: NavItem | null; next: NavItem | null }

export interface ExerciseView {
  id: string;
  title: string;
  type: 'mcq' | 'fill-blank' | 'code-output' | 'code-method' | 'code-design';
  prompt: string;
  drill: boolean;
  drillTarget: number;
  state: ExerciseState;
  // mcq
  options?: string[];
  round?: number;
  multi?: boolean;
  // fill-blank
  code?: string;
  // code-*
  starter?: string;
  expectedOutput?: string;
  stdin?: string;
  visibleTests?: VisibleTest[];
  hiddenTestCount?: number;
  hintCount?: number;
  hasSolution?: boolean;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  leetcodeUrl?: string;
  unitTitle?: string;
  unitId?: string;
  isProblem?: boolean;
  lessonId?: string | null;
  nav?: PageNav;
}

export interface TestResultView {
  index: number;
  hidden: boolean;
  pass: boolean;
  note?: string;
  input?: string;
  expected?: string;
  actual?: string;
  error?: string;
  debug?: string;
  timeMs?: number;
}

export interface GradeResult {
  status: 'pass' | 'fail' | 'compile-error' | 'runtime-error' | 'timeout' | 'error';
  message?: string;
  results?: TestResultView[];
  passed?: number;
  total?: number;
  actualOutput?: string;
  expectedOutput?: string;
  wrongBlanks?: string[];
  diagnostics?: { line: number; message: string }[];
}

export interface SubmitResponse {
  /** Blank / unchanged submission: nothing was graded or recorded. */
  skipped?: boolean;
  message?: string;
  result?: GradeResult;
  state: ExerciseState;
  counted?: boolean;
  drill?: { counted: boolean; consecutive: number; target: number; justMastered: boolean };
  review?: { graded: boolean; passed: boolean; intervalDays?: number; dueAt?: string; lapses?: number };
  options?: string[];
  dueCount?: number;
}

export interface CourseLesson { id: string; title: string; exerciseIds: string[] }
export interface CourseProblem { id: string; title: string; difficulty: string | null }
export interface CourseUnit {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
  problems: CourseProblem[];
}
export interface CourseState {
  status: ExerciseState['status'];
  consecutive: number;
  attempts: number;
  withHelp: boolean;
  drill: boolean;
  target: number;
}
export interface Course {
  title: string;
  units: CourseUnit[];
  states: Record<string, CourseState>;
  dueCount: number;
}

export interface LessonView {
  id: string;
  unitId: string;
  unitTitle?: string;
  title: string;
  sections: ({ kind: 'markdown'; markdown: string } | { kind: 'exercise'; exerciseId: string })[];
  exercises: Record<string, ExerciseView>;
  nav?: PageNav;
}

export interface ReviewItem {
  exerciseId: string;
  title: string;
  type: string;
  drill: boolean;
  unitTitle: string;
  dueAt: string;
  overdueDays: number;
  daysUntilDue: number;
  intervalDays: number;
  reviews: number;
  lapses: number;
  leech: boolean;
  lessonId: string | null;
  href: string;
}

export interface ReviewQueue {
  today: string;
  items: ReviewItem[];
  ahead: ReviewItem[];
  nextDue: { day: string; count: number } | null;
}

export interface Dashboard {
  today: string;
  units: {
    id: string; title: string; total: number; done: number;
    lessonExercises: { done: number; total: number };
    drills: { mastered: number; total: number };
    problems: { clean: number; withHelp: number; total: number };
  }[];
  totals: {
    lessonDone: number; lessonTotal: number; drillsMastered: number; drillsTotal: number;
    problemsClean: number; problemsHelp: number; problemsTotal: number;
  };
  activity: { day: string; submissions: number; passes: number }[];
  streak: number;
  forecast: { day: string; count: number }[];
  retention: { reviews: number; passed: number };
  leeches: { exerciseId: string; title: string; unitTitle: string; lapses: number; href: string }[];
  weakAreas: { id: string; title: string; score: number; lapses: number; hinted: number; solutions: number; attempts: number }[];
  dueCount: number;
}

export interface JdkStatus { ok: boolean; javaVersion?: string; javacVersion?: string; problem?: string }
