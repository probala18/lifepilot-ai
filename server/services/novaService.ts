import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient } from './bedrockClient.js';

const DEFAULT_MODEL_ID =
  process.env.BEDROCK_MODEL_ID ||
  'arn:aws:bedrock:us-east-1:420796370696:inference-profile/global.amazon.nova-2-lite-v1:0';

interface NovaResponse {
  response: string;
  reasoning: string;
}

export async function generateNovaResponse(
  systemPrompt: string,
  userMessage: string,
  options?: { modelId?: string },
): Promise<NovaResponse> {
  const modelId = options?.modelId || DEFAULT_MODEL_ID;

  const command = new ConverseCommand({
    modelId,
    system: [{ text: systemPrompt }],
    messages: [
      {
        role: 'user',
        content: [{ text: userMessage }],
      },
    ],
    inferenceConfig: {
      maxTokens: 10000,
      temperature: 1,
    },
    additionalModelRequestFields: {
      reasoningConfig: { type: 'enabled', maxReasoningEffort: 'low' },
    },
    performanceConfig: { latency: 'standard' },
  });

  let lastError: unknown;

  // Retry once on transient failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await bedrockClient.send(command);

      let responseText = '';
      let reasoningText = '';

      for (const block of result.output?.message?.content ?? []) {
        if ('text' in block && block.text) {
          responseText += block.text;
        }
        if ('reasoningContent' in block) {
          const rc = block.reasoningContent as { reasoningText?: { text?: string } };
          if (rc?.reasoningText?.text) {
            reasoningText += rc.reasoningText.text;
          }
        }
      }

      return { response: responseText, reasoning: reasoningText };
    } catch (err) {
      lastError = err;
      console.error(`Bedrock request attempt ${attempt + 1} failed:`, err);
      if (attempt === 0) continue; // retry once
    }
  }

  throw lastError;
}
