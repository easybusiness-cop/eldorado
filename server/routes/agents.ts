import { Router, Response, Request } from 'express';
import { agentFleetRegistry } from '../agents/registry.ts';
import { agentRuntime } from '../agents/runtime.ts';
import { mastra } from '../ai/mastra/index.ts';
import { requireAuth, AuthenticatedRequest } from '../security/auth.middleware.ts';
import { agentIntelligenceEvaluator } from '../core/evaluation/agent-intelligence.evaluator.ts';
import { browserService } from '../tools/browser/browser.service.ts';

export const agentRouter = Router();

// GET /api/agents/intelligence/evaluation - Retrieve fleet intelligence evaluation
agentRouter.get('/intelligence/evaluation', async (_req: Request, res: Response) => {
  try {
    const cached = agentIntelligenceEvaluator.getCachedReport();
    if (cached) {
      return res.json({ success: true, report: cached });
    }
    const report = await agentIntelligenceEvaluator.evaluateFleetIntelligence();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents/intelligence/evaluate - Trigger fresh live evaluation benchmark
agentRouter.post('/intelligence/evaluate', async (_req: Request, res: Response) => {
  try {
    const report = await agentIntelligenceEvaluator.evaluateFleetIntelligence();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/agents/intelligence/chromium - Verify and connect Chromium directly
agentRouter.get('/intelligence/chromium', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.identity?.organizationId;
    if (!organizationId) return res.status(401).json({ success: false, error: 'Organization authentication is required.' });
    const status = await browserService.getBrowserStatus(organizationId);
    const testBrowse = await browserService.browseAsAgent('system', 'https://example.com', organizationId);
    res.json({
      success: true,
      chromium: {
        status: status.status,
        browser: status.browser,
        version: status.version,
        capabilities: status.capabilities,
        activeSessions: status.activeSessions,
        liveTest: {
          success: testBrowse.success,
          engine: testBrowse.engine,
          pageTitle: testBrowse.info?.title,
          url: testBrowse.url,
          durationMs: testBrowse.durationMs,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

agentRouter.get('/', (_req, res) => {
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

agentRouter.post('/:id/execute', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const identity = req.identity;

    if (!identity) {
      return res.status(401).json({
        error: "Authentication required.",
        code: "AUTH_REQUIRED",
      });
    }

    const organizationId = identity.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        error: "Authenticated organization is required.",
        code: "ORGANIZATION_REQUIRED",
      });
    }

    const { title, description } = req.body;
    const result = await agentRuntime.executeAgentTask(req.params.id, {
      id: `task-${Date.now()}`,
      title: title || 'Task Execution',
      description: description || 'Execute agent capabilities',
      organizationId,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});
