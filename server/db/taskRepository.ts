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
  const normalizedDueAt = (() => {
    if (!dueAt) return null;
    const parsed = new Date(dueAt).getTime();
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : dueAt;
  })();

  const stmt = db.prepare(`
    INSERT INTO tasks (user_sub, user_email, task, due_at, suggested_action)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(userSub, userEmail, task, normalizedDueAt, suggestedAction);

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(result.lastInsertRowid)) as unknown as Task;
}

export function getDueReminders(): Task[] {
  const db = getDb();
  const candidates = db.prepare(`
    SELECT * FROM tasks
    WHERE due_at IS NOT NULL
      AND reminder_sent = 0
      AND completed = 0
  `).all() as unknown as Task[];

  const now = Date.now();
  return candidates.filter((task) => {
    if (!task.due_at) return false;
    const due = new Date(task.due_at).getTime();
    return Number.isFinite(due) && due <= now;
  });
}

export function markReminderSent(taskId: number): void {
  const db = getDb();
  db.prepare('UPDATE tasks SET reminder_sent = 1 WHERE id = ?').run(taskId);
}

export function getTasksByUser(userSub?: string): Task[] {
  const db = getDb();
  if (userSub && userSub !== 'local_user') {
    return db.prepare(
      'SELECT * FROM tasks WHERE user_sub = ? ORDER BY created_at DESC',
    ).all(userSub) as unknown as Task[];
  }
  // Return all tasks for local single-user experience
  return db.prepare(
    'SELECT * FROM tasks ORDER BY created_at DESC',
  ).all() as unknown as Task[];
}

export function completeTask(taskId: number, _userSub?: string): boolean {
  const db = getDb();
  const result = db.prepare(
    'UPDATE tasks SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END WHERE id = ?',
  ).run(taskId);
  return result.changes > 0;
}

export function deleteTask(taskId: number, _userSub?: string): boolean {
  const db = getDb();
  const result = db.prepare(
    'DELETE FROM tasks WHERE id = ?',
  ).run(taskId);
  return result.changes > 0;
}
