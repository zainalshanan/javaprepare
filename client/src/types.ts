export interface ExerciseState {
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered';
  consecutive: number;
  attempts: number;
  hintsUsed: number;
  solutionViewed: boolean;
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
}

export interface SubmitResponse { result: GradeResult; state: ExerciseState }

export interface CourseLesson { id: string; title: string; exerciseIds: string[] }
export interface CourseProblem { id: string; title: string; difficulty: string | null }
export interface CourseUnit {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
  problems: CourseProblem[];
}
export interface Course {
  title: string;
  units: CourseUnit[];
  states: Record<string, { status: ExerciseState['status']; consecutive: number; attempts: number }>;
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
  unitTitle: string;
  dueAt: string;
  intervalDays: number;
  lessonId: string | null;
}

export interface Dashboard {
  units: { id: string; title: string; total: number; done: number; passRate: number | null }[];
  activity: { day: string; submissions: number; passes: number }[];
  streak: number;
  dueCount: number;
  mastered: number;
  completed: number;
  totalExercises: number;
}

export interface JdkStatus { ok: boolean; javaVersion?: string; javacVersion?: string; problem?: string }
