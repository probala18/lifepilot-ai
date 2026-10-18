import cron from 'node-cron';
import { getDueReminders, markReminderSent } from '../db/taskRepository.js';
import { sendReminderEmail, validateEmailConfig, verifyEmailTransport } from '../services/emailService.js';

export async function checkAndDispatchDueReminders(): Promise<{ checked: number; sent: number }> {
  try {
    const dueTasks = getDueReminders();

    if (dueTasks.length === 0) {
      return { checked: 0, sent: 0 };
    }

    console.log(`[reminder-cron] Found ${dueTasks.length} due reminder(s)`);
    let sent = 0;

    for (const task of dueTasks) {
      try {
        await sendReminderEmail(
          task.user_email,
          task.task,
          task.due_at!,
          task.suggested_action,
        );
        markReminderSent(task.id);
        sent++;
        console.log(`[reminder-cron] Reminder sent for task #${task.id}: "${task.task}" to ${task.user_email}`);
      } catch (err) {
        console.error(`[reminder-cron] Failed to send reminder for task #${task.id}:`, err);
      }
    }

    return { checked: dueTasks.length, sent };
  } catch (err) {
    console.error('[reminder-cron] Error checking due reminders:', err);
    return { checked: 0, sent: 0 };
  }
}

export function startReminderCron(): void {
  const emailCfg = validateEmailConfig();
  if (!emailCfg.ok) {
    console.warn(`[reminder-cron] Email reminders disabled: ${emailCfg.reason}`);
  } else {
    verifyEmailTransport().catch((err) => {
      console.error('[reminder-cron] SMTP verification failed:', err);
    });
  }

  // Run every minute
  cron.schedule('* * * * *', async () => {
    await checkAndDispatchDueReminders();
  });

  console.log('[reminder-cron] Cron job started — checking every minute for due reminders');
}
