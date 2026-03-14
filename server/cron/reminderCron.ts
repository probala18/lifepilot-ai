import cron from 'node-cron';
import { getDueReminders, markReminderSent } from '../db/taskRepository.js';
import { sendReminderEmail } from '../services/emailService.js';

export function startReminderCron(): void {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const dueTasks = getDueReminders();

      if (dueTasks.length === 0) return;

      console.log(`[reminder-cron] Found ${dueTasks.length} due reminder(s)`);

      for (const task of dueTasks) {
        try {
          await sendReminderEmail(
            task.user_email,
            task.task,
            task.due_at!,
            task.suggested_action,
          );
          markReminderSent(task.id);
        } catch (err) {
          console.error(`[reminder-cron] Failed to send reminder for task ${task.id}:`, err);
        }
      }
    } catch (err) {
      console.error('[reminder-cron] Error checking due reminders:', err);
    }
  });

  console.log('[reminder-cron] Cron job started — checking every minute for due reminders');
}
