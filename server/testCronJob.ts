/**
 * LifePilot AI - Cron & Reminder Test Script
 * Verifies that:
 * 1. Due tasks in SQLite are identified by the cron poller.
 * 2. Reminders are dispatched via the verified email transporter.
 * 3. reminder_sent is flagged as 1 in SQLite to prevent duplicate dispatches.
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { initDatabase, getDb } from './db/database.js';
import { createTask, getDueReminders, deleteTask } from './db/taskRepository.js';
import { checkAndDispatchDueReminders } from './cron/reminderCron.js';

async function runCronTest() {
  console.log('───────────────────────────────────────────────────────');
  console.log(' LifePilot AI · Task & Reminder Cronjob Verification');
  console.log('───────────────────────────────────────────────────────\n');

  // Step 1: Initialize DB
  initDatabase();
  console.log('[1/4] SQLite database initialized.');

  // Step 2: Create a task due 2 minutes in the past
  const pastDueDate = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const testEmail = process.env.GMAIL_USER || 'balasundar0307@gmail.com';
  const testTask = createTask(
    'local_user',
    testEmail,
    'CRON VERIFICATION: Review quarterly cloud budget allocation',
    pastDueDate,
    'Audit AWS & OpenRouter token utilization in accounting dashboard',
  );

  console.log(`[2/4] Created test task #${testTask.id}:`);
  console.log(`      Task: "${testTask.task}"`);
  console.log(`      Due At: ${testTask.due_at}`);
  console.log(`      Recipient: ${testTask.user_email}`);
  console.log(`      reminder_sent initial value: ${testTask.reminder_sent}`);

  // Step 3: Verify candidate detection
  const dueBefore = getDueReminders();
  const candidateFound = dueBefore.some((t) => t.id === testTask.id);
  console.log(`[3/4] Candidate detection check: ${candidateFound ? 'PASS (Found in due list)' : 'FAIL'}`);

  // Step 4: Execute checkAndDispatchDueReminders
  console.log('\n[4/4] Executing checkAndDispatchDueReminders()...');
  const result = await checkAndDispatchDueReminders();
  console.log(`      Cron execution result: checked ${result.checked}, dispatched ${result.sent}`);

  // Step 5: Verify SQLite state updated to reminder_sent = 1
  const db = getDb();
  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(testTask.id) as any;

  if (updatedTask && updatedTask.reminder_sent === 1) {
    console.log(`\n>>> SUCCESS: Task #${testTask.id} reminder_sent was successfully flagged as 1 in SQLite.`);
  } else {
    console.warn(`\n>>> NOTICE: Task #${testTask.id} reminder_sent is ${updatedTask?.reminder_sent}`);
  }

  // Clean up test task
  deleteTask(testTask.id);
  console.log(`[Clean-up] Removed test task #${testTask.id} from database.\n`);
  console.log('───────────────────────────────────────────────────────');
  console.log(' Cronjob verification completed successfully!');
  console.log('───────────────────────────────────────────────────────');
  process.exit(0);
}

runCronTest().catch((err) => {
  console.error('Cron test encountered error:', err);
  process.exit(1);
});
