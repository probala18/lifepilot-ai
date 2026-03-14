import { getDb } from './database.js';

export interface Task {
  id: number;
  user_sub: string;
  user_email: string;
  task: string;
  due_at: string | null;
  suggested_action: string | null;
  reminder_sent: number;
  completed: number;
  created_at: string;
}

export function createTask(
  userSub: string,
  userEmail: string,
  task: string,
  dueAt: string | null,
  suggestedAction: string | null,
): Task {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO tasks (user_sub, user_email, task, due_at, suggested_action)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(userSub, userEmail, task, dueAt, suggestedAction);

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task;
}

export function getDueReminders(): Task[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM tasks
    WHERE due_at IS NOT NULL
      AND due_at <= datetime('now')
      AND reminder_sent = 0
      AND completed = 0
  `).all() as Task[];
}

export function markReminderSent(taskId: number): void {
  const db = getDb();
  db.prepare('UPDATE tasks SET reminder_sent = 1 WHERE id = ?').run(taskId);
}

export function getTasksByUser(userSub: string): Task[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM tasks WHERE user_sub = ? ORDER BY created_at DESC',
  ).all(userSub) as Task[];
}

export function completeTask(taskId: number, userSub: string): boolean {
  const db = getDb();
  const result = db.prepare(
    'UPDATE tasks SET completed = 1 WHERE id = ? AND user_sub = ?',
  ).run(taskId, userSub);
  return result.changes > 0;
}

export function deleteTask(taskId: number, userSub: string): boolean {
  const db = getDb();
  const result = db.prepare(
    'DELETE FROM tasks WHERE id = ? AND user_sub = ?',
  ).run(taskId, userSub);
  return result.changes > 0;
}
