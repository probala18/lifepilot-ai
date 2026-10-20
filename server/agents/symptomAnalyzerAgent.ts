import { generateNovaResponse } from '../services/novaService.js';

const SYSTEM_PROMPT = `You are a medical AI assistant.

Analyze the symptoms described by the user.

Provide:
1. Possible conditions
2. Severity level
3. Recommended next steps

Always remind user to consult a real doctor.

Return ONLY valid JSON matching this exact schema — no markdown, no extra text:
{
  "possibleCondition": "string",
  "advice": "string",
  "whenToConsultDoctor": "string",
  "disclaimer": "This is not medical advice."
}`;

export async function handleHealthRequest(userInput: string) {
  const { response, reasoning } = await generateNovaResponse(SYSTEM_PROMPT, userInput);

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

  // Always enforce the disclaimer
  data.disclaimer = 'This is not medical advice.';

  return { data, reasoning };
}
