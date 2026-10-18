import express from 'express';
import { handleAssistantRequest } from '../agents/personalAssistantAgent.js';
import { handleShoppingRequest } from '../agents/shoppingDecisionAgent.js';
import { handleHealthRequest } from '../agents/symptomAnalyzerAgent.js';
import { getTasksByUser, completeTask, deleteTask } from '../db/taskRepository.js';

const router = express.Router();

type AgentName = 'assistant' | 'shopping' | 'health';

const agentHandlers: Record<Exclude<AgentName, 'assistant'>, (msg: string) => Promise<{ data: unknown; reasoning: string }>> = {
  shopping: handleShoppingRequest,
  health: handleHealthRequest,
};

const VALID_AGENTS: AgentName[] = ['assistant', 'shopping', 'health'];

// Unified agent endpoint
router.post('/agent', async (req: any, res) => {
  const { agent, message } = req.body as { agent?: string; message?: string };

  if (!agent || !message) {
    return res.status(400).json({ success: false, error: 'Both "agent" and "message" fields are required' });
  }

  if (!VALID_AGENTS.includes(agent as AgentName)) {
    return res.status(400).json({ success: false, error: `Invalid agent: ${agent}. Must be one of: assistant, shopping, health` });
  }

  try {
    let data: unknown;
    let reasoning: string;

    if (agent === 'assistant') {
      const user = req.user as { sub: string; email: string };
      ({ data, reasoning } = await handleAssistantRequest(message, user.sub, user.email));
    } else {
      const handler = agentHandlers[agent as Exclude<AgentName, 'assistant'>];
      ({ data, reasoning } = await handler(message));
    }

    res.json({
      success: true,
      agent,
      response: data,
      reasoning,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Agent [${agent}] Error:`, error);
    res.status(500).json({
      success: false,
      agent,
      error: 'Failed to process request. Please try again.',
      timestamp: new Date().toISOString(),
    });
  }
});

// Backward-compatible aliases — delegate to the same agent handlers
router.post('/assistant', async (req: any, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    const user = req.user as { sub: string; email: string };
    const { data } = await handleAssistantRequest(message, user.sub, user.email);
    res.json(data);
  } catch (error) {
    console.error('Assistant Error:', error);
    res.status(500).json({ error: 'Failed to process assistant request' });
  }
});

router.post('/shopping', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    const { data } = await handleShoppingRequest(message);
    res.json(data);
  } catch (error) {
    console.error('Shopping Error:', error);
    res.status(500).json({ error: 'Failed to process shopping request' });
  }
});

router.post('/health', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    const { data } = await handleHealthRequest(message);
    res.json(data);
  } catch (error) {
    console.error('Health Error:', error);
    res.status(500).json({ error: 'Failed to process health request' });
  }
});

// ─── Task management endpoints ───────────────────────────────────────────────

router.get('/tasks', (_req: any, res) => {
  try {
    const tasks = getTasksByUser();
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Tasks Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

router.patch('/tasks/:id/complete', (req: any, res) => {
  const taskId = Number(req.params.id);
  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ success: false, error: 'Invalid task ID' });
  }
  try {
    const updated = completeTask(taskId);
    if (!updated) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Complete Task Error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete task' });
  }
});

router.delete('/tasks/:id', (req: any, res) => {
  const taskId = Number(req.params.id);
  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ success: false, error: 'Invalid task ID' });
  }
  try {
    const deleted = deleteTask(taskId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

export default router;
