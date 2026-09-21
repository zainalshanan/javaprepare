// ---------- Content / exercise schema ----------

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export type JavaType =
  | 'int' | 'long' | 'double' | 'boolean' | 'char' | 'String'
  | 'int[]' | 'long[]' | 'double[]' | 'boolean[]' | 'char[]' | 'String[]'
  | 'int[][]' | 'char[][]' | 'String[][]'
  | 'List<Integer>' | 'List<String>' | 'List<List<Integer>>' | 'List<List<String>>'
  | 'ListNode' | 'ListNode[]' | 'TreeNode' | 'void';

export type CompareMode = 'exact' | 'unordered' | 'unordered-deep' | 'set' | 'epsilon';

export interface MethodSig {
  name: string;
  params: { name: string; type: JavaType }[];
  returns: JavaType;
}

export interface MethodTest {
  args: Json[];
  expected: Json;
  /** For void methods: which argument to serialize after the call (default 0). */
  checkParam?: number;
  compare?: CompareMode;
  hidden?: boolean;
  /** Human-readable note shown with the test, e.g. "empty array". */
  note?: string;
}

export interface DesignTest {
  /** First op must be the constructor (class name). */
  ops: string[];
  args: Json[][];
  expected: Json[];
  hidden?: boolean;
  note?: string;
}

interface ExerciseBase {
  id: string;
  title: string;
  /** Markdown prompt shown above the exercise. */
  prompt: string;
  /** Mastery drill: requires N consecutive passes, then enters spaced repetition. */
  drill?: boolean;
  /** Consecutive passes needed to master a drill (default 3). */
  drillTarget?: number;
}

export interface McqExercise extends ExerciseBase {
  type: 'mcq';
  options: string[];
  /** Index (or indices for multi-answer) into options. */
  answer: number | number[];
  explanation?: string;
}

export interface FillBlankExercise extends ExerciseBase {
  type: 'fill-blank';
  /** Code with {{1}}, {{2}}, ... markers. */
  code: string;
  /** blanks["1"] = list of accepted answers (token-normalized). */
  blanks: Record<string, string[]>;
  explanation?: string;
}

export interface CodeOutputExercise extends ExerciseBase {
  type: 'code-output';
  starter: string;
  expectedOutput: string;
  stdin?: string;
  solution?: { code: string; explanation?: string };
  hints?: string[];
}

export interface CodeMethodExercise extends ExerciseBase {
  type: 'code-method';
  method: MethodSig;
  starter: string;
  tests: MethodTest[];
  solution?: { code: string; explanation?: string };
  hints?: string[];
  /** Problem metadata (present when this is a NeetCode problem). */
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  leetcodeUrl?: string;
}

export interface CodeDesignExercise extends ExerciseBase {
  type: 'code-design';
  className: string;
  /** Constructor is keyed by the class name. */
  methods: Record<string, { params: JavaType[]; returns: JavaType }>;
  starter: string;
  tests: DesignTest[];
  solution?: { code: string; explanation?: string };
  hints?: string[];
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  leetcodeUrl?: string;
}

export type Exercise =
  | McqExercise
  | FillBlankExercise
  | CodeOutputExercise
  | CodeMethodExercise
  | CodeDesignExercise;

export type CodeExercise = CodeOutputExercise | CodeMethodExercise | CodeDesignExercise;

// ---------- Course structure ----------

export interface LessonRef { id: string; title: string }

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: LessonRef[];
  /** Problem exercise ids (files under content/problems/**). */
  problems?: string[];
}

export interface Curriculum { title: string; units: Unit[] }

/** A lesson is markdown split into sections; exercises appear between sections. */
export type LessonSection = { kind: 'markdown'; markdown: string } | { kind: 'exercise'; exerciseId: string };

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  sections: LessonSection[];
}

// ---------- Grading results ----------

export interface TestResultView {
  index: number;
  hidden: boolean;
  pass: boolean;
  note?: string;
  input?: string;    // pretty-printed, omitted for hidden tests
  expected?: string; // omitted for hidden tests
  actual?: string;   // omitted for hidden tests
  error?: string;    // runtime exception message
  debug?: string;    // captured user stdout
  timeMs?: number;
}

export interface GradeResult {
  status: 'pass' | 'fail' | 'compile-error' | 'runtime-error' | 'timeout' | 'error';
  message?: string;         // compile error text or general failure message
  results?: TestResultView[];
  passed?: number;
  total?: number;
  /** For code-output: what the program printed vs expected. */
  actualOutput?: string;
  expectedOutput?: string;
  /** fill-blank: keys of blanks that were wrong. */
  wrongBlanks?: string[];
  /** Compile errors located in the learner's file (1-based lines). */
  diagnostics?: { line: number; message: string }[];
}
