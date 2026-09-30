import { Router } from 'express';
import { composioClient } from '../integrations/composio/client.ts';
import { composioAuth } from '../integrations/composio/auth.ts';
import { composioToolGateway } from '../integrations/composio/tools.ts';

export const composioRouter = Router();

// 1. Get Composio status and connection overview
composioRouter.get('/status', async (_req, res) => {
  try {
    if (composioClient.isConfigured()) {
      await composioAuth.syncConnectionsFromComposio().catch((err) => {
        console.warn('[Composio Sync Notice]', err?.message);
      });
    }

    const connections = composioAuth.getAllConnections();
    const isConfigured = composioClient.isConfigured();

    res.json({
      success: true,
      configured: isConfigured,
      hasApiKey: isConfigured,
      activeConnectionsCount: connections.filter((c) => c.connected).length,
      totalSupportedProviders: connections.length,
      connections,
      version: '0.18.0',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to retrieve Composio status',
    });
  }
});

// 2. Get list of available tools
composioRouter.get('/tools', async (_req, res) => {
  try {
    const registeredActions = composioToolGateway.getAllActions();
    res.json({
      success: true,
      totalTools: registeredActions.length,
      tools: registeredActions.map((a) => ({
        actionId: a.actionId,
        provider: a.provider,
        name: a.name,
        description: a.description,
        schema: a.schema,
      })),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to list Composio tools',
    });
  }
});

// 3. Initiate Connection for a provider (GitHub, Slack, Gmail, Notion, etc.)
composioRouter.post('/connect', async (req, res) => {
  const { provider, userId = 'default_user' } = req.body;
  if (!provider) {
    return res.status(400).json({
      success: false,
      error: 'Provider name is required (e.g., "github", "slack", "gmail", "notion").',
    });
  }

  try {
    const result = await composioAuth.initiateConnection(provider.toLowerCase(), userId);
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || `Failed to initiate connection for ${provider}`,
    });
  }
});

// 4. Disconnect a provider
composioRouter.post('/disconnect', async (req, res) => {
  const { provider } = req.body;
  if (!provider) {
    return res.status(400).json({
      success: false,
      error: 'Provider name is required.',
    });
  }

  try {
    const deleted = await composioAuth.deleteConnection(provider.toLowerCase());
    res.json({
      success: true,
      provider,
      disconnected: deleted,
      message: `Disconnected ${provider} integration successfully.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || `Failed to disconnect ${provider}`,
    });
  }
});

// 5. Execute a Composio Tool Call
composioRouter.post('/execute', async (req, res) => {
  const { actionId, parameters = {}, userId = 'default_user' } = req.body;
  if (!actionId) {
    return res.status(400).json({
      success: false,
      error: 'actionId is required (e.g. "HACKERNEWS_GET_TOP_STORIES", "WEATHER_GET_WEATHER", "GITHUB_CREATE_ISSUE").',
    });
  }

  const startTime = Date.now();
  try {
    const output = await composioToolGateway.executeTool(actionId, parameters, userId);
    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      actionId,
      parameters,
      durationMs,
      timestamp: new Date().toISOString(),
      output,
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      actionId,
      durationMs,
      error: err?.message || `Tool execution for "${actionId}" failed.`,
    });
  }
});
