import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const MAX_OUTPUT = 1_000_000; // 1MB cap on captured stdout/stderr

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  durationMs: number;
}

export function execCmd(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs: number; stdin?: string },
): Promise<ExecResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(cmd, args, { cwd: opts.cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, opts.timeoutMs);

    const finish = (exitCode: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode, timedOut, durationMs: Date.now() - started });
    };

    child.stdout.on('data', (d: Buffer) => {
      if (stdout.length < MAX_OUTPUT) stdout += d.toString('utf8');
      if (stdout.length >= MAX_OUTPUT) {
        stdout = stdout.slice(0, MAX_OUTPUT) + '\n...[output truncated]';
        child.kill('SIGKILL');
      }
    });
    child.stderr.on('data', (d: Buffer) => {
      if (stderr.length < MAX_OUTPUT) stderr += d.toString('utf8');
    });
    child.on('error', (err) => {
      stderr += `\nFailed to start ${cmd}: ${err.message}`;
      finish(-1);
    });
    child.on('close', (code) => finish(code));

    if (opts.stdin !== undefined) child.stdin.write(opts.stdin);
    child.stdin.end();
  });
}

export interface JavaRunRequest {
  /** filename -> source */
  files: Record<string, string>;
  mainClass: string;
  stdin?: string;
  compileTimeoutMs?: number;
  runTimeoutMs?: number;
}

export interface JavaRunResult {
  phase: 'compile-error' | 'compile-timeout' | 'ok' | 'run-error' | 'run-timeout';
  compile: ExecResult;
  run?: ExecResult;
}

export async function compileAndRun(req: JavaRunRequest): Promise<JavaRunResult> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'javaprep-'));
  try {
    const names = Object.keys(req.files);
    await Promise.all(names.map((n) => writeFile(path.join(dir, n), req.files[n], 'utf8')));

    const compile = await execCmd('javac', ['-encoding', 'UTF-8', ...names], {
      cwd: dir,
      timeoutMs: req.compileTimeoutMs ?? 20_000,
    });
    if (compile.timedOut) return { phase: 'compile-timeout', compile };
    if (compile.exitCode !== 0) return { phase: 'compile-error', compile };

    const run = await execCmd(
      'java',
      ['-Xmx256m', '-Dfile.encoding=UTF-8', req.mainClass],
      { cwd: dir, timeoutMs: req.runTimeoutMs ?? 10_000, stdin: req.stdin },
    );
    if (run.timedOut) return { phase: 'run-timeout', compile, run };
    if (run.exitCode !== 0) return { phase: 'run-error', compile, run };
    return { phase: 'ok', compile, run };
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export interface JdkStatus {
  ok: boolean;
  javaVersion?: string;
  javacVersion?: string;
  problem?: string;
}

export async function checkJdk(): Promise<JdkStatus> {
  const javac = await execCmd('javac', ['-version'], { timeoutMs: 10_000 });
  const java = await execCmd('java', ['-version'], { timeoutMs: 10_000 });
  const javacOut = (javac.stdout + javac.stderr).trim();
  const javaOut = (java.stdout + java.stderr).trim().split('\n')[0];
  if (javac.exitCode !== 0 || java.exitCode !== 0) {
    return {
      ok: false,
      problem:
        javac.exitCode !== 0
          ? 'javac (the Java compiler) was not found on your PATH. Install a JDK (not just a JRE).'
          : 'java was not found on your PATH.',
    };
  }
  const m = javacOut.match(/javac\s+(\d+)/);
  const major = m ? parseInt(m[1], 10) : 0;
  if (major > 0 && major < 17) {
    return { ok: false, javacVersion: javacOut, javaVersion: javaOut, problem: `JDK ${major} found, but JDK 17+ is required.` };
  }
  return { ok: true, javacVersion: javacOut, javaVersion: javaOut };
}
