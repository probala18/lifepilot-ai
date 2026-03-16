import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;
let transporterVerified = false;

export function validateEmailConfig(): { ok: boolean; reason?: string } {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return {
      ok: false,
      reason: 'Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env',
    };
  }

  return { ok: true };
}

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const cfg = validateEmailConfig();
    if (!cfg.ok) {
      throw new Error(cfg.reason);
    }

    const user = process.env.GMAIL_USER as string;
    const pass = process.env.GMAIL_APP_PASSWORD as string;

    // Prefer explicit SMTP config when provided; fallback to Gmail service.
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
    } else {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
  }
  return transporter;
}

export async function verifyEmailTransport(): Promise<void> {
  const transport = getTransporter();
  if (transporterVerified) return;

  await transport.verify();
  transporterVerified = true;
  console.log('[email] SMTP transporter verified');
}

export async function sendReminderEmail(
  to: string,
  taskName: string,
  dueAt: string,
  suggestedAction: string | null,
): Promise<void> {
  const transport = getTransporter();

  if (!transporterVerified) {
    await verifyEmailTransport();
  }

  const formattedDue = new Date(dueAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const actionLine = suggestedAction
    ? `<p><strong>Suggested action:</strong> ${suggestedAction}</p>`
    : '';

  await transport.sendMail({
    from: `"LifePilot AI" <${process.env.GMAIL_USER}>`,
    to,
    subject: `⏰ Reminder: ${taskName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">LifePilot Reminder</h2>
        <p>Hey! This is your reminder for:</p>
        <blockquote style="border-left: 4px solid #3b82f6; padding-left: 12px; color: #1e293b;">
          ${taskName}
        </blockquote>
        <p><strong>Due:</strong> ${formattedDue}</p>
        ${actionLine}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Sent by LifePilot AI</p>
      </div>
    `,
  });

  console.log(`[email] Reminder sent to ${to} for task "${taskName}"`);
}
