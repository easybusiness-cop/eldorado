import { Router } from 'express';
import { n8nService } from '../integrations/n8n/n8n.service.ts';

export const n8nRouter = Router();

// GET /api/n8n/status - check n8n integration health
n8nRouter.get('/status', (_req, res) => {
  const config = n8nService.getConfig();
  const workflows = n8nService.getWorkflows();
  const logs = n8nService.getExecutionLogs();

  res.json({
    success: true,
    engine: 'n8n Workflow Automation Bridge',
    instanceUrl: config.instanceUrl,
    activeWorkflows: workflows.filter((w) => w.active).length,
    totalWorkflows: workflows.length,
    totalExecutions: logs.length,
    status: 'connected',
    inboundWebhookUrl: `${_req.protocol}://${_req.get('host')}/api/n8n/webhook`,
  });
});

// GET /api/n8n/config - get n8n configuration
n8nRouter.get('/config', (_req, res) => {
  res.json({ success: true, config: n8nService.getConfig() });
});

// POST /api/n8n/config - update n8n configuration
n8nRouter.post('/config', (req, res) => {
  try {
    const updated = n8nService.updateConfig(req.body);
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to update config' });
  }
});

// GET /api/n8n/workflows - list all workflows
n8nRouter.get('/workflows', (_req, res) => {
  res.json({ success: true, workflows: n8nService.getWorkflows() });
});

// POST /api/n8n/workflows - create or update a workflow
n8nRouter.post('/workflows', (req, res) => {
  try {
    const saved = n8nService.saveWorkflow(req.body);
    res.json({ success: true, workflow: saved });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message || 'Failed to save workflow' });
  }
});

// DELETE /api/n8n/workflows/:id - delete a workflow
n8nRouter.delete('/workflows/:id', (req, res) => {
  const deleted = n8nService.deleteWorkflow(req.params.id);
  res.json({ success: deleted });
});

// POST /api/n8n/trigger - dispatch an outbound trigger
n8nRouter.post('/trigger', async (req, res) => {
  try {
    const { workflowId, webhookUrl, payload } = req.body;
    const target = workflowId || webhookUrl;
    if (!target) {
      return res.status(400).json({ success: false, error: 'workflowId or webhookUrl is required' });
    }

    const result = await n8nService.triggerWorkflow(target, payload || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Workflow trigger failed' });
  }
});

// GET /api/n8n/history - retrieve execution audit log
n8nRouter.get('/history', (_req, res) => {
  res.json({ success: true, logs: n8nService.getExecutionLogs() });
});

// POST /api/n8n/webhook/:webhookId - inbound webhook receiver from n8n instances
n8nRouter.post('/webhook/:webhookId', (req, res) => {
  try {
    const webhookId = req.params.webhookId;
    const result = n8nService.handleInboundWebhook(webhookId, req.body, req.headers);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Inbound webhook processing failed' });
  }
});

// POST /api/n8n/webhook (default root receiver)
n8nRouter.post('/webhook', (req, res) => {
  try {
    const result = n8nService.handleInboundWebhook('general-inbound', req.body, req.headers);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Inbound webhook processing failed' });
  }
});
