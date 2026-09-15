import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CodeDesignExercise, CodeMethodExercise, CodeOutputExercise,
  GradeResult, Json, TestResultView,
} from '../types.ts';
import { compileAndRun } from './runner.ts';
import {
  formatDesignInput, formatMethodInput, generateDesignHarness,
  generateMethodHarness, parseHarnessOutput,
} from './codegen.ts';
import { compareValues, normalizeOutput, outputsMatch } from './compare.ts';
import { cleanCompileErrors, cleanRuntimeError, compileDiagnostics, detectClassName } from './errors.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JAVA_LIB = path.resolve(__dirname, '../../java-lib');

const lib = (name: string) => readFileSync(path.join(JAVA_LIB, name), 'utf8');
const SUPPORT_FILES: Record<string, string> = {
  'Ser.java': lib('Ser.java'),
  'H.java': lib('H.java'),
  'ListNode.java': lib('ListNode.java'),
  'TreeNode.java': lib('TreeNode.java'),
};

const RUN_TIMEOUT_PER_TEST = 5_000;
const RUN_TIMEOUT_BASE = 5_000;
const RUN_TIMEOUT_MAX = 30_000;

export async function gradeCodeOutput(ex: CodeOutputExercise, code: string): Promise<GradeResult> {
  const className = detectClassName(code);
  if (!className) {
    return { status: 'compile-error', message: 'No class found. Write a class with a `public static void main(String[] args)` method.' };
  }
  if (!/static\s+void\s+main/.test(code)) {
    return { status: 'compile-error', message: 'No `main` method found. Your program needs `public static void main(String[] args)` as its entry point.' };
  }
  const fileName = `${className}.java`;
  const res = await compileAndRun({
    files: { [fileName]: code },
    mainClass: className,
    stdin: ex.stdin,
    runTimeoutMs: 10_000,
  });
  if (res.phase === 'compile-timeout') return { status: 'timeout', message: 'Compilation timed out.' };
  if (res.phase === 'compile-error') {
    return { status: 'compile-error', message: cleanCompileErrors(res.compile.stderr, [fileName]), diagnostics: compileDiagnostics(res.compile.stderr, fileName) };
  }
  if (res.phase === 'run-timeout') {
    return { status: 'timeout', message: 'Your program ran for too long (10s limit). Check for an infinite loop.', actualOutput: res.run?.stdout, expectedOutput: ex.expectedOutput };
  }
  if (res.phase === 'run-error') {
    return { status: 'runtime-error', message: cleanRuntimeError(res.run?.stderr ?? ''), actualOutput: res.run?.stdout, expectedOutput: ex.expectedOutput };
  }
  const actual = res.run!.stdout;
  const pass = outputsMatch(ex.expectedOutput, actual);
  return {
    status: pass ? 'pass' : 'fail',
    actualOutput: normalizeOutput(actual),
    expectedOutput: normalizeOutput(ex.expectedOutput),
  };
}

export async function gradeCodeMethod(ex: CodeMethodExercise, code: string): Promise<GradeResult> {
  const harness = generateMethodHarness(ex);
  return runHarness(
    { 'Solution.java': code, 'Main.java': harness, ...SUPPORT_FILES },
    ex.tests.map((t, i) => ({
      hidden: !!t.hidden,
      note: t.note,
      input: formatMethodInput(ex, t),
      expected: t.expected,
      compare: t.compare ?? (ex.method.returns === 'double' || ex.method.returns === 'double[]' ? 'epsilon' : 'exact'),
    })),
    'Solution.java',
  );
}

export async function gradeCodeDesign(ex: CodeDesignExercise, code: string): Promise<GradeResult> {
  let harness: string;
  try {
    harness = generateDesignHarness(ex);
  } catch (e) {
    return { status: 'error', message: `Content error: ${(e as Error).message}` };
  }
  return runHarness(
    { [`${ex.className}.java`]: code, 'Main.java': harness, ...SUPPORT_FILES },
    ex.tests.map((t) => ({
      hidden: !!t.hidden,
      note: t.note,
      input: formatDesignInput(t),
      expected: t.expected as Json,
      compare: 'exact' as const,
    })),
    `${ex.className}.java`,
  );
}

interface TestSpec {
  hidden: boolean;
  note?: string;
  input: string;
  expected: Json;
  compare: 'exact' | 'unordered' | 'unordered-deep' | 'set' | 'epsilon';
}

async function runHarness(
  files: Record<string, string>,
  tests: TestSpec[],
  userFile: string,
): Promise<GradeResult> {
  const timeout = Math.min(RUN_TIMEOUT_MAX, RUN_TIMEOUT_BASE + tests.length * RUN_TIMEOUT_PER_TEST);
  const res = await compileAndRun({ files, mainClass: 'Main', runTimeoutMs: timeout });

  if (res.phase === 'compile-timeout') return { status: 'timeout', message: 'Compilation timed out.' };
  if (res.phase === 'compile-error') {
    return { status: 'compile-error', message: cleanCompileErrors(res.compile.stderr, [userFile]), diagnostics: compileDiagnostics(res.compile.stderr, userFile) };
  }

  const stdout = res.run?.stdout ?? '';
  const { outcomes } = parseHarnessOutput(stdout, tests.length);
  const timedOut = res.phase === 'run-timeout';
  const crashed = res.phase === 'run-error';

  const results: TestResultView[] = tests.map((t, i) => {
    const o = outcomes[i];
    const base: TestResultView = { index: i, hidden: t.hidden, pass: false, note: t.note };
    if (!o.ran) {
      base.error = timedOut
        ? 'Time limit exceeded (test did not finish)'
        : crashed
          ? 'Did not run (a previous test crashed the JVM)'
          : 'Did not run';
    } else if (o.threw !== undefined) {
      base.error = o.threw;
    } else {
      base.pass = compareValues(t.expected, o.value ?? null, t.compare);
      base.timeMs = o.timeMs;
    }
    if (!t.hidden) {
      base.input = t.input;
      base.expected = JSON.stringify(t.expected);
      if (o.ran && o.threw === undefined) base.actual = JSON.stringify(o.value ?? null);
      if (o.debug) base.debug = o.debug;
    } else if (base.pass) {
      // fine to reveal nothing for passing hidden tests
    } else if (o.debug) {
      base.debug = '(output hidden for hidden test)';
    }
    return base;
  });

  const passed = results.filter((r) => r.pass).length;
  const allPass = passed === tests.length;
  let status: GradeResult['status'] = allPass ? 'pass' : 'fail';
  if (!allPass && timedOut && results.some((r) => r.error?.startsWith('Time limit'))) status = 'timeout';
  const message = crashed && passed === 0 && results.every((r) => r.error)
    ? cleanRuntimeError(res.run?.stderr ?? '')
    : undefined;

  return { status, message, results, passed, total: tests.length };
}
