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
  updated_at: string;
}

export interface SrsState {
  exercise_id: string;
  ease: number;
  interval_days: number;
  due_at: string;
  reviews: number;
  lapses: number;
}

export function openDb(file?: string) {
  let dbPath = file;
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
  `);
  return new Db(db);
}

export class Db {
  constructor(private db: DatabaseSync) {}

  recordAttempt(exerciseId: string, passed: boolean, code: string | null, isReview: boolean) {
    this.db
      .prepare('INSERT INTO attempts (exercise_id, passed, is_review, code) VALUES (?, ?, ?, ?)')
      .run(exerciseId, passed ? 1 : 0, isReview ? 1 : 0, code);
    const day = new Date().toISOString().slice(0, 10);
    this.db
      .prepare(`INSERT INTO daily_activity (day, submissions, passes) VALUES (?, 1, ?)
                ON CONFLICT(day) DO UPDATE SET submissions = submissions + 1, passes = passes + ?`)
      .run(day, passed ? 1 : 0, passed ? 1 : 0);
  }

  getState(exerciseId: string): ExerciseState | undefined {
    return this.db.prepare('SELECT * FROM exercise_state WHERE exercise_id = ?').get(exerciseId) as ExerciseState | undefined;
  }

  allStates(): ExerciseState[] {
    return this.db.prepare('SELECT * FROM exercise_state').all() as unknown as ExerciseState[];
  }

  upsertState(s: Omit<ExerciseState, 'updated_at'>) {
    this.db
      .prepare(`INSERT INTO exercise_state (exercise_id, status, consecutive, attempts, hints_used, solution_viewed, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                ON CONFLICT(exercise_id) DO UPDATE SET
                  status = excluded.status, consecutive = excluded.consecutive, attempts = excluded.attempts,
                  hints_used = excluded.hints_used, solution_viewed = excluded.solution_viewed, updated_at = datetime('now')`)
      .run(s.exercise_id, s.status, s.consecutive, s.attempts, s.hints_used, s.solution_viewed);
  }

  getSrs(exerciseId: string): SrsState | undefined {
    return this.db.prepare('SELECT * FROM srs_state WHERE exercise_id = ?').get(exerciseId) as SrsState | undefined;
  }

  upsertSrs(s: SrsState) {
    this.db
      .prepare(`INSERT INTO srs_state (exercise_id, ease, interval_days, due_at, reviews, lapses)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(exercise_id) DO UPDATE SET
                  ease = excluded.ease, interval_days = excluded.interval_days, due_at = excluded.due_at,
                  reviews = excluded.reviews, lapses = excluded.lapses`)
      .run(s.exercise_id, s.ease, s.interval_days, s.due_at, s.reviews, s.lapses);
  }

  dueReviews(now: string): SrsState[] {
    return this.db.prepare('SELECT * FROM srs_state WHERE due_at <= ? ORDER BY due_at').all(now) as unknown as SrsState[];
  }

  allSrs(): SrsState[] {
    return this.db.prepare('SELECT * FROM srs_state').all() as unknown as SrsState[];
  }

  activity(days: number): { day: string; submissions: number; passes: number }[] {
    return this.db
      .prepare(`SELECT * FROM daily_activity WHERE day >= date('now', ?) ORDER BY day`)
      .all(`-${days} days`) as unknown as { day: string; submissions: number; passes: number }[];
  }

  attemptStats(): { exercise_id: string; total: number; passed: number }[] {
    return this.db
      .prepare('SELECT exercise_id, COUNT(*) as total, SUM(passed) as passed FROM attempts GROUP BY exercise_id')
      .all() as unknown as { exercise_id: string; total: number; passed: number }[];
  }
}
