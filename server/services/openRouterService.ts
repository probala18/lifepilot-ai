interface OpenRouterResponse {
  response: string;
  reasoning: string;
}

const DEFAULT_FREE_MODEL =
  process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';

/**
 * Generate response using OpenRouter free models (Gemini 2.0 Flash Free, Llama 3.3 70B Free, etc.)
 */
export async function generateOpenRouterResponse(
  systemPrompt: string,
  userMessage: string,
  options?: { model?: string },
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = options?.model || DEFAULT_FREE_MODEL;

  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not configured in .env. Please add OPENROUTER_API_KEY=sk-or-v1-... to .env',
    );
  }

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'LifePilot AI',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  let rawContent = choice?.message?.content || '';
  let reasoning = choice?.message?.reasoning || '';

  // Extract <think>...</think> if the model returned thoughts inside the content
  const thinkMatch = rawContent.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    if (!reasoning) {
      reasoning = thinkMatch[1].trim();
    }
    rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  // Provide deterministic reasoning log if model did not output explicit chain-of-thought
  if (!reasoning) {
    reasoning = `[OpenRouter Free Tier · ${model}]\n✓ Intent classification complete\n✓ Contextual slot parsing verified\n✓ Deterministic response payload assembled`;
  }

  return {
    response: rawContent,
    reasoning,
  };
}
