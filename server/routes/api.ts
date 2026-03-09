import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = express.Router();

let aiClient: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// 1. Agentic Personal Assistant
router.post('/assistant', async (req, res) => {
  try {
    const ai = getAi();
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: `You are an Agentic AI Personal Assistant. Extract the task, time, and suggest an action from the user's request.
Respond ONLY in JSON format matching this schema:
{
  "task": "string",
  "time": "string (e.g., 'Tomorrow at 10 AM', '6 PM', or 'Not specified')",
  "suggestedAction": "string"
}`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            task: { type: Type.STRING },
            time: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
          },
          required: ['task', 'time', 'suggestedAction'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (error) {
    console.error('Assistant Error:', error);
    res.status(500).json({ error: 'Failed to process assistant request' });
  }
});

// 2. AI Shopping Decision Assistant
router.post('/shopping', async (req, res) => {
  try {
    const ai = getAi();
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: `You are an AI Shopping Decision Assistant. Analyze the user's query about a product.
Consider price, reviews, and alternatives.
Respond ONLY in JSON format matching this schema:
{
  "recommendation": "string (e.g., 'Buy', 'Wait', 'Don't Buy')",
  "reason": "string (detailed reason based on price, reviews, etc.)",
  "betterAlternative": "string (or 'None' if it's the best choice)"
}`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING },
            reason: { type: Type.STRING },
            betterAlternative: { type: Type.STRING },
          },
          required: ['recommendation', 'reason', 'betterAlternative'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (error) {
    console.error('Shopping Error:', error);
    res.status(500).json({ error: 'Failed to process shopping request' });
  }
});

// 3. AI Health Symptom Analyzer
router.post('/health', async (req, res) => {
  try {
    const ai = getAi();
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: `You are an AI Health Symptom Analyzer. Analyze the user's symptoms.
Respond ONLY in JSON format matching this schema:
{
  "possibleCondition": "string",
  "advice": "string",
  "whenToConsultDoctor": "string",
  "disclaimer": "string (MUST be exactly: 'This is not medical advice.')"
}`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibleCondition: { type: Type.STRING },
            advice: { type: Type.STRING },
            whenToConsultDoctor: { type: Type.STRING },
            disclaimer: { type: Type.STRING },
          },
          required: ['possibleCondition', 'advice', 'whenToConsultDoctor', 'disclaimer'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    // Ensure disclaimer is present
    data.disclaimer = 'This is not medical advice.';
    res.json(data);
  } catch (error) {
    console.error('Health Error:', error);
    res.status(500).json({ error: 'Failed to process health request' });
  }
});

export default router;
