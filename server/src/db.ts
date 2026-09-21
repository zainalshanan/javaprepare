import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

export interface ExerciseState {
  exercise_id: string;
  status: 'in-progress' | 'completed' | 'mastered';
  consecutive: number;
  attempts: number;
  hints_used: number;
  solution_viewed: number;
  completed_at: string | null;
  mastered_at: string | null;
  /** Bit flags (progress.ts HELP_*) for help used since the last pass. */
  rep_help: number;
  wrong_since_pass: number;
  /** MCQ option shuffle seed component; bumps on each pass. */
  shuffle_round: number;
  /** Snapshot at first completion; null for rows completed before this column existed. */
  solved_with_help: number | null;
  updated_at: string;
}

export interface SrsState {
  exercise_id: string;
  ease: number;
  interval_days: number;
  /** Local calendar day 'YYYY-MM-DD' the item becomes due. */
  due_at: string;
  reviews: number;
  lapses: number;
  last_reviewed_at: string | null;
}

export interface SrsLogEntry {
  exercise_id: string;
  ts: string;
  passed: number;
  interval_before: number;
  interval_after: number;
  ease_before: number;
  ease_after: number;
}

export interface AttemptRow {
  exercise_id: string;
  passed: number;
  is_review: number;
  status: string | null;
  created_at: string;
}

/** Opens (and migrates in place) the progress DB. `file` or JAVAPREPARE_DB overrides data/progress.db. */
export function openDb(file?: string) {
  let dbPath = file ?? process.env.JAVAPREPARE_DB;
  if (!dbPath) {
    mkdirSync(DATA_DIR, { recursive: true });
    dbPath = path.join(DATA_DIR, 'progress.db');
  }
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id TEXT NOT NULL,
      passed INTEGER NOT NULL,
      is_review INTEGER NOT NULL DEFAULT 0,
      code TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_attempts_ex ON attempts(exercise_id);
    CREATE TABLE IF NOT EXISTS exercise_state (
      exercise_id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'in-progress',
      consecutive INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      hints_used INTEGER NOT NULL DEFAULT 0,
      solution_viewed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS srs_state (
      exercise_id TEXT PRIMARY KEY,
      ease REAL NOT NULL,
      interval_days REAL NOT NULL,
      due_at TEXT NOT NULL,
      reviews INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS daily_activity (
      day TEXT PRIMARY KEY,
      submissions INTEGER NOT NULL DEFAULT 0,
      passes INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS srs_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      passed INTEGER NOT NULL,
      interval_before REAL NOT NULL,
      interval_after REAL NOT NULL,
      ease_before REAL NOT NULL,
      ease_after REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_srs_log_ts ON srs_log(ts);
  `);
  addColumns(db, 'attempts', {
    status: 'TEXT', tests_passed: 'INTEGER', tests_total: 'INTEGER',
  });
  addColumns(db, 'exercise_state', {
    completed_at: 'TEXT', mastered_at: 'TEXT',
    rep_help: 'INTEGER NOT NULL DEFAULT 0', wrong_since_pass: 'INTEGER NOT NULL DEFAULT 0',
    shuffle_round: 'INTEGER NOT NULL DEFAULT 0', solved_with_help: 'INTEGER',
  });
  addColumns(db, 'srs_state', { last_reviewed_at: 'TEXT' });
  // Legacy rows stored due_at as an ISO timestamp; scheduling is now by local calendar day.
  db.exec(`UPDATE srs_state SET due_at = substr(due_at, 1, 10) WHERE length(due_at) > 10`);
  return new Db(db);
}

function addColumns(db: DatabaseSync, table: string, cols: Record<string, string>) {
  const existing = new Set((db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name));
  for (const [name, type] of Object.entries(cols)) {
    if (!existing.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
  }
}

export class Db {
  constructor(private db: DatabaseSync) {}

  recordAttempt(a: {
    exerciseId: string; passed: boolean; code: string | null; isReview: boolean;
    status: string; testsPassed?: number; testsTotal?: number;
  }) {
    this.db
      .prepare(`INSERT INTO attempts (exercise_id, passed, is_review, code, status, tests_passed, tests_total)
                VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(a.exerciseId, a.passed ? 1 : 0, a.isReview ? 1 : 0, a.code, a.status, a.testsPassed ?? null, a.testsTotal ?? null);
  }

  lastCode(exerciseId: string): string | null {
    const row = this.db
      .prepare('SELECT code FROM attempts WHERE exercise_id = ? AND code IS NOT NULL ORDER BY id DESC LIMIT 1')
      .get(exerciseId) as { code: string } | undefined;
    return row?.code ?? null;
  }

  allAttempts(): AttemptRow[] {
    return this.db.prepare('SELECT exercise_id, passed, is_review, status, created_at FROM attempts ORDER BY id').all() as unknown as AttemptRow[];
  }

  getState(exerciseId: string): ExerciseState | undefined {
    return this.db.prepare('SELECT * FROM exercise_state WHERE exercise_id = ?').get(exerciseId) as ExerciseState | undefined;
  }

  allStates(): ExerciseState[] {
    return this.db.prepare('SELECT * FROM exercise_state').all() as unknown as ExerciseState[];
  }

  upsertState(s: ExerciseState) {
    this.db
      .prepare(`INSERT INTO exercise_state (exercise_id, status, consecutive, attempts, hints_used, solution_viewed,
                  completed_at, mastered_at, rep_help, wrong_since_pass, shuffle_round, solved_with_help, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                ON CONFLICT(exercise_id) DO UPDATE SET
                  status = excluded.status, consecutive = excluded.consecutive, attempts = excluded.attempts,
                  hints_used = excluded.hints_used, solution_viewed = excluded.solution_viewed,
                  completed_at = excluded.completed_at, mastered_at = excluded.mastered_at, rep_help = excluded.rep_help,
                  wrong_since_pass = excluded.wrong_since_pass, shuffle_round = excluded.shuffle_round,
                  solved_with_help = excluded.solved_with_help, updated_at = datetime('now')`)
      .run(s.exercise_id, s.status, s.consecutive, s.attempts, s.hints_used, s.solution_viewed,
        s.completed_at, s.mastered_at, s.rep_help, s.wrong_since_pass, s.shuffle_round, s.solved_with_help);
  }

  getSrs(exerciseId: string): SrsState | undefined {
    return this.db.prepare('SELECT * FROM srs_state WHERE exercise_id = ?').get(exerciseId) as SrsState | undefined;
  }

  upsertSrs(s: SrsState) {
    this.db
      .prepare(`INSERT INTO srs_state (exercise_id, ease, interval_days, due_at, reviews, lapses, last_reviewed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(exercise_id) DO UPDATE SET
                  ease = excluded.ease, interval_days = excluded.interval_days, due_at = excluded.due_at,
                  reviews = excluded.reviews, lapses = excluded.lapses, last_reviewed_at = excluded.last_reviewed_at`)
      .run(s.exercise_id, s.ease, s.interval_days, s.due_at, s.reviews, s.lapses, s.last_reviewed_at);
  }

  deleteSrs(exerciseId: string) {
    this.db.prepare('DELETE FROM srs_state WHERE exercise_id = ?').run(exerciseId);
  }

  logSrs(e: SrsLogEntry) {
    this.db
      .prepare(`INSERT INTO srs_log (exercise_id, ts, passed, interval_before, interval_after, ease_before, ease_after)
                VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(e.exercise_id, e.ts, e.passed, e.interval_before, e.interval_after, e.ease_before, e.ease_after);
  }

  srsLogSince(iso: string): SrsLogEntry[] {
    return this.db.prepare('SELECT * FROM srs_log WHERE ts >= ? ORDER BY ts').all(iso) as unknown as SrsLogEntry[];
  }

  lastSrsLog(exerciseId: string): SrsLogEntry | undefined {
    return this.db.prepare('SELECT * FROM srs_log WHERE exercise_id = ? ORDER BY id DESC LIMIT 1').get(exerciseId) as SrsLogEntry | undefined;
  }

  /** Items due on or before `today` (a local day). */
  dueReviews(today: string): SrsState[] {
    return this.allSrs().filter((s) => s.due_at.slice(0, 10) <= today);
  }

  allSrs(): SrsState[] {
    return this.db.prepare('SELECT * FROM srs_state ORDER BY due_at').all() as unknown as SrsState[];
  }

  /** Runs fn in a transaction (node:sqlite is synchronous, so this is atomic w.r.t. other requests). */
  tx<T>(fn: () => T): T {
    this.db.exec('BEGIN');
    try {
      const r = fn();
      this.db.exec('COMMIT');
      return r;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
}
