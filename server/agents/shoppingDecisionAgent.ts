import { generateNovaResponse } from '../services/novaService.js';

const SYSTEM_PROMPT = `You are an AI product analyst.

Analyze the product decision requested by the user.

Provide:
1. Pros
2. Cons
3. Better alternatives
4. Final recommendation

Return ONLY valid JSON matching this exact schema — no markdown, no extra text:
{
  "recommendation": "string (e.g., 'Buy', 'Wait', 'Don't Buy')",
  "reason": "string (detailed reason based on price, reviews, etc.)",
  "betterAlternative": "string (or 'None' if it's the best choice)"
}`;

export async function handleShoppingRequest(userInput: string) {
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

  return { data, reasoning };
}
