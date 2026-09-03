import { Router } from 'express';
import { agentFleetRegistry } from '../agents/registry.ts';
import { agentRuntime } from '../agents/runtime.ts';
import { mastra } from '../ai/mastra/index.ts';

export const agentRouter = Router();

agentRouter.get('/', (req, res) => {
  res.json({
    success: true,
    agents: agentFleetRegistry.getAllAgents(),
  });
});

agentRouter.get('/:id', (req, res) => {
  const agent = agentFleetRegistry.getAgent(req.params.id);
  if (!agent) {
    return res.status(404).json({ success: false, error: 'Agent not found' });
  }
  res.json({ success: true, agent });
});

agentRouter.post('/:id/execute', async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await agentRuntime.executeAgentTask(req.params.id, {
      id: `task-${Date.now()}`,
      title: title || 'Task Execution',
      description: description || 'Execute agent capabilities',
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});
