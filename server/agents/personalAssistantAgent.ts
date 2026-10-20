import { generateNovaResponse } from '../services/novaService.js';
import { createTask } from '../db/taskRepository.js';

const SYSTEM_PROMPT = `You are an AI productivity assistant.
Extract tasks, deadlines, and actions from user input.

Return ONLY valid JSON matching this exact schema — no markdown, no extra text:
{
  "task": "string",
  "time": "string (e.g., 'Tomorrow at 10 AM', '6 PM', or 'Not specified')",
  "isoTime": "string | null (ISO 8601 datetime like '2026-03-12T15:00:00'. Compute this from the user's relative references such as 'tomorrow', 'next Monday', etc., relative to the current date/time provided below. Use null if no specific time can be determined.)",
  "suggestedAction": "string"
}

Current date/time: {{CURRENT_DATETIME}}`;

export async function handleAssistantRequest(
  userInput: string,
  userSub: string,
  userEmail: string,
) {
  const prompt = SYSTEM_PROMPT.replace('{{CURRENT_DATETIME}}', new Date().toISOString());
  const { response, reasoning } = await generateNovaResponse(prompt, userInput);

  // Parse JSON safely even if model wraps in markdown or extra text
  let data: any;
  const cleaned = response.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
  try {
    data = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      data = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Invalid JSON returned from model: ${response.slice(0, 100)}`);
    }
  }

  // Persist the task to SQLite so the cron job can send reminders
  const saved = createTask(
    userSub,
    userEmail,
    data.task,
    data.isoTime ?? null,
    data.suggestedAction ?? null,
  );

  return {
    data: { ...data, taskId: saved.id, reminderScheduled: !!saved.due_at },
    reasoning,
  };
}
