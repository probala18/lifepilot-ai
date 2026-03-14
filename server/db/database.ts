import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'lifepilot.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(): void {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_sub      TEXT    NOT NULL,
      user_email    TEXT    NOT NULL,
      task          TEXT    NOT NULL,
      due_at        TEXT,
      suggested_action TEXT,
      reminder_sent INTEGER NOT NULL DEFAULT 0,
      completed     INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Index for the cron query: due reminders not yet sent
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_due
      ON tasks (due_at, reminder_sent, completed)
  `);

  // Index for per-user lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_user
      ON tasks (user_sub)
  `);

  console.log('[db] SQLite database initialized at', DB_PATH);
}
