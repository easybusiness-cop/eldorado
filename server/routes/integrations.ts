import { Router } from 'express';
import { composioRegistry } from '../integrations/composio/registry.ts';
import { toolGateway } from '../tools/gateway.ts';

export const integrationRouter = Router();

integrationRouter.get('/status', async (req, res) => {
  try {
    await composioRegistry.sync();
  } catch (err) {
    console.error('Failed to sync Composio connections:', err);
  }
  res.json({
    success: true,
    ...composioRegistry.getStatusSummary(),
  });
});

integrationRouter.post('/tool/execute', async (req, res) => {
  const result = await toolGateway.execute(req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});
