import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../../src/utils/supabaseAdmin.ts';
import { mastraAgentRegistry } from '../ai/mastra/agents/index.ts';
import { browserService } from '../tools/browser/browser.service.ts';
import { digitalIdentityService } from '../identity/digital-identity.service.ts';
import { applicationAccountManager, type PlatformType } from '../identity/application-account-manager.ts';
import { googleWorkspaceService } from '../identity/google-workspace.service.ts';
import { kmsEnvelopeEncryptionService } from '../security/kms-envelope-encryption.service.ts';
import type { AuthenticatedRequest, RuffloCapability } from '../security/auth.middleware.ts';

export const identityRouter = Router();
export const identityOAuthCallbackRouter = Router();

const REQUESTABLE_AGENT_CAPABILITIES = new Set([
  'gmail:read', 'gmail:send', 'accounts:manage', 'accounts:linkedin', 'accounts:instagram',
  'accounts:youtube', 'accounts:canva', 'accounts:github', 'accounts:x_twitter', 'accounts:custom',
  'browser:persist',
]);
const SUPPORTED_PLATFORMS = new Set<PlatformType>([
  'linkedin', 'instagram', 'youtube', 'canva', 'github', 'x_twitter', 'custom', 'google_workspace',
]);

function organizationId(req: AuthenticatedRequest): string | null {
  return req.identity?.organizationId || null;
}

function permits(req: AuthenticatedRequest, capability: RuffloCapability): boolean {
  return Boolean(req.identity && (
    req.identity.capabilities.includes('system:admin') ||
    req.identity.capabilities.includes(capability) ||
    (capability === 'identity:read' && req.identity.capabilities.includes('identity:manage')) ||
    (capability === 'identity:manage' && req.identity.role === 'admin')
  ));
}

function requireIdentityCapability(capability: RuffloCapability) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.identity) return res.status(401).json({ success: false, error: 'Authentication required.' });
    if (!permits(req, capability)) return res.status(403).json({ success: false, error: `Requires ${capability}.` });
    next();
  };
}

function requireAgent(agentId: string) {
  const agent = mastraAgentRegistry.getAgent(agentId) || mastraAgentRegistry.getAllAgents()
    .find((candidate) => candidate.getId().toLowerCase() === agentId.toLowerCase());
  if (!agent) return null;
  return agent;
}

async function ensureIdentity(orgId: string, agentId: string) {
  const agent = requireAgent(agentId);
  if (!agent) return null;
  return digitalIdentityService.getOrCreateIdentity(orgId, agent.getId(), {
    displayName: agent.getName(),
    role: agent.config.role,
  });
}

async function safeBrowserSession(agentId: string, orgId: string) {
  const session = browserService.getAgentSession(agentId, orgId);
  if (session) return { ...session, persistenceProtected: session.isPersistent && kmsEnvelopeEncryptionService.isConfigured() };
  return { status: 'idle' as const, isPersistent: kmsEnvelopeEncryptionService.isConfigured(), persistenceProtected: kmsEnvelopeEncryptionService.isConfigured(), cookiesCount: 0, currentUrl: 'about:blank' };
}

identityRouter.get('/agents', requireIdentityCapability('identity:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = organizationId(req)!;
    const agents = mastraAgentRegistry.getAllAgents();
    await Promise.all(agents.map((agent) => digitalIdentityService.getOrCreateIdentity(orgId, agent.getId(), {
      displayName: agent.getName(), role: agent.config.role,
    })));
    const identities = await digitalIdentityService.listAllIdentities(orgId);
    const enriched = await Promise.all(identities.map(async (identity) => ({
      ...identity,
      browserSession: await safeBrowserSession(identity.agentId, orgId),
    })));
    res.json({ success: true, count: enriched.length, organizationId: orgId, identities: enriched });
  } catch {
    res.status(503).json({ success: false, error: 'Identity service is temporarily unavailable.' });
  }
});

identityRouter.get('/google/status', requireIdentityCapability('identity:read'), (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    configured: googleWorkspaceService.isConfigured(),
    workspaceDomain: process.env.GOOGLE_WORKSPACE_DOMAIN || null,
    workspaceEncryptionConfigured: kmsEnvelopeEncryptionService.isConfigured(),
  });
});

identityRouter.get('/agent/:agentId', requireIdentityCapability('identity:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = organizationId(req)!;
    const identity = await ensureIdentity(orgId, req.params.agentId);
    if (!identity) return res.status(404).json({ success: false, error: 'Agent is not registered.' });
    res.json({ success: true, identity: { ...identity, browserSession: await safeBrowserSession(identity.agentId, orgId) } });
  } catch {
    res.status(503).json({ success: false, error: 'Identity service is temporarily unavailable.' });
  }
});

// Existing route retained as a policy-gated account registry request. No third-party account is created here.
identityRouter.post('/agent/:agentId/provision-account', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.identity || (!req.identity.capabilities.includes('task:run') && !req.identity.capabilities.includes('system:admin'))) {
      return res.status(403).json({ success: false, error: 'Requires task:run.' });
    }
    const orgId = organizationId(req)!;
    const identity = await ensureIdentity(orgId, req.params.agentId);
    if (!identity) return res.status(404).json({ success: false, error: 'Agent is not registered.' });
    const { platform, accountHandle } = req.body || {};
    if (typeof platform !== 'string' || !SUPPORTED_PLATFORMS.has(platform as PlatformType)) {
      return res.status(400).json({ success: false, error: 'A supported platform is required.' });
    }
    const handle = typeof accountHandle === 'string' ? accountHandle.trim() : '';
    if (!handle) return res.status(400).json({ success: false, error: 'The existing account handle or account email is required.' });
    const result = await applicationAccountManager.provisionAccount({
      agentId: identity.agentId, organizationId: orgId, platform: platform as PlatformType, accountHandle: handle,
      requestedBy: req.identity!.userId,
    }, identity.permissions);
    if (!result.success) return res.status(403).json(result);
    await digitalIdentityService.logIdentityActivity(orgId, identity.agentId, 'ACCOUNT_ACCESS_REQUESTED', `Requested authorized ${platform} account access.`);
    res.status(202).json({ ...result, message: 'Access request recorded. The account is not connected until the platform authorization completes.' });
  } catch {
    res.status(503).json({ success: false, error: 'Account registry is temporarily unavailable.' });
  }
});

identityRouter.post('/accounts/:accountId/decision', requireIdentityCapability('identity:manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const { approved } = req.body || {};
    if (typeof approved !== 'boolean') return res.status(400).json({ success: false, error: 'approved must be a boolean.' });
    const orgId = organizationId(req)!;
    const account = await applicationAccountManager.decideAccessRequest({
      organizationId: orgId,
      accountId: req.params.accountId,
      approved,
      decidedBy: req.identity!.userId,
    });
    if (!account) return res.status(404).json({ success: false, error: 'Pending account request not found.' });
    await digitalIdentityService.logIdentityActivity(
      orgId,
      account.agentId,
      approved ? 'ACCOUNT_ACCESS_APPROVED' : 'ACCOUNT_ACCESS_DENIED',
      `${account.platform} access request ${approved ? 'approved for official provider authorization' : 'denied'}.`,
    );
    res.json({
      success: true,
      account,
      message: approved
        ? 'Access approved. The agent must still complete the external platform authorization; no account was created.'
        : 'Access request denied.',
    });
  } catch {
    res.status(503).json({ success: false, error: 'Account request decision could not be saved.' });
  }
});

identityRouter.post('/accounts/:accountId/connection', requireIdentityCapability('identity:manage'), async (req: AuthenticatedRequest, res) => {
  try {
    if (req.body?.authorized !== true) return res.status(400).json({ success: false, error: 'Confirm that the provider authorization completed before continuing.' });
    const orgId = organizationId(req)!;
    const account = await applicationAccountManager.getAccountById(orgId, req.params.accountId);
    if (!account) return res.status(404).json({ success: false, error: 'Connected account request not found.' });
    if (account.platform === 'google_workspace') return res.status(409).json({ success: false, error: 'Google Workspace authorization is confirmed by its OAuth callback.' });
    const session = browserService.getAgentSession(account.agentId, orgId);
    if (!session || session.status !== 'active' || !session.isPersistent) {
      return res.status(409).json({ success: false, error: 'Start the agent’s encrypted browser workspace and complete the provider authorization first.' });
    }
    const identity = await digitalIdentityService.getIdentity(orgId, account.agentId);
    if (!identity) return res.status(404).json({ success: false, error: 'Agent identity is not registered in this organization.' });
    const connected = await applicationAccountManager.confirmProviderAuthorization({
      organizationId: orgId,
      accountId: account.id,
      confirmedBy: req.identity!.userId,
      browserSessionId: identity.workspaceId,
    });
    if (!connected) return res.status(409).json({ success: false, error: 'Account request is no longer awaiting authorization confirmation.' });
    await digitalIdentityService.logIdentityActivity(orgId, account.agentId, 'ACCOUNT_PROVIDER_AUTHORIZED', `Manager confirmed the authorized ${account.platform} browser session.`);
    res.json({ success: true, account: connected, message: 'The existing external account is now marked as authorized for this agent.' });
  } catch {
    res.status(503).json({ success: false, error: 'Provider authorization could not be confirmed.' });
  }
});

identityRouter.post('/agent/:agentId/capability-requests', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.identity || (!req.identity.capabilities.includes('task:run') && !req.identity.capabilities.includes('system:admin'))) {
      return res.status(403).json({ success: false, error: 'Requires task:run.' });
    }
    const orgId = organizationId(req)!;
    const identity = await ensureIdentity(orgId, req.params.agentId);
    if (!identity) return res.status(404).json({ success: false, error: 'Agent is not registered.' });
    const { capability, reason } = req.body || {};
    if (typeof capability !== 'string' || !REQUESTABLE_AGENT_CAPABILITIES.has(capability)) {
      return res.status(400).json({ success: false, error: 'The requested capability is not eligible for self-service approval.' });
    }
    if (typeof reason !== 'string' || reason.trim().length < 8 || reason.length > 2000) {
      return res.status(400).json({ success: false, error: 'Provide a reason between 8 and 2000 characters.' });
    }
    const db = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await db.from('agent_identity_capability_requests').select('*')
      .eq('organization_id', orgId).eq('agent_id', identity.agentId).eq('capability', capability).eq('status', 'pending').maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return res.status(202).json({ success: true, request: existing });
    const { data, error } = await db.from('agent_identity_capability_requests').insert({
      organization_id: orgId,
      agent_id: identity.agentId,
      capability,
      reason: reason.trim(),
      status: 'pending',
      requested_by: req.identity.userId,
    }).select('id,agent_id,capability,reason,status,created_at').single();
    if (error || !data) throw error;
    await digitalIdentityService.logIdentityActivity(orgId, identity.agentId, 'CAPABILITY_REQUESTED', `Requested capability ${capability}.`);
    res.status(202).json({ success: true, request: data });
  } catch {
    res.status(503).json({ success: false, error: 'Capability request could not be recorded.' });
  }
});

identityRouter.get('/capability-requests', requireIdentityCapability('identity:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { data, error } = await getSupabaseAdmin().from('agent_identity_capability_requests')
      .select('id,agent_id,capability,reason,status,requested_by,decided_by,decision_reason,created_at,decided_at')
      .eq('organization_id', organizationId(req)!).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    res.json({ success: true, canManage: permits(req, 'identity:manage'), requests: data ?? [] });
  } catch {
    res.status(503).json({ success: false, error: 'Capability requests are temporarily unavailable.' });
  }
});

identityRouter.post('/capability-requests/:requestId/decision', requireIdentityCapability('identity:manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = organizationId(req)!;
    const { approved, reason } = req.body || {};
    if (typeof approved !== 'boolean') return res.status(400).json({ success: false, error: 'approved must be a boolean.' });
    const db = getSupabaseAdmin();
    const { data: request, error: lookupError } = await db.from('agent_identity_capability_requests').select('*')
      .eq('id', req.params.requestId).eq('organization_id', orgId).eq('status', 'pending').maybeSingle();
    if (lookupError || !request) return res.status(404).json({ success: false, error: 'Pending capability request not found.' });
    const status = approved ? 'approved' : 'denied';
    if (approved) {
      const { error } = await db.from('agent_identity_permissions').upsert({
        organization_id: orgId,
        agent_id: request.agent_id,
        permission: request.capability,
        granted_by: req.identity!.userId,
      }, { onConflict: 'organization_id,agent_id,permission' });
      if (error) throw error;
    }
    const { data, error } = await db.from('agent_identity_capability_requests').update({
      status,
      decided_by: req.identity!.userId,
      decision_reason: typeof reason === 'string' ? reason.trim().slice(0, 2000) : null,
      decided_at: new Date().toISOString(),
    }).eq('id', request.id).eq('organization_id', orgId).eq('status', 'pending')
      .select('id,agent_id,capability,status,decided_at').maybeSingle();
    if (error || !data) throw error;
    await digitalIdentityService.logIdentityActivity(orgId, request.agent_id, `CAPABILITY_${status.toUpperCase()}`, `Capability ${request.capability} ${status}.`);
    res.json({ success: true, request: data });
  } catch {
    res.status(503).json({ success: false, error: 'Capability decision could not be saved.' });
  }
});

identityRouter.post('/agent/:agentId/google/authorize', requireIdentityCapability('identity:manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = organizationId(req)!;
    const identity = await ensureIdentity(orgId, req.params.agentId);
    if (!identity) return res.status(404).json({ success: false, error: 'Agent is not registered.' });
    const authorizationUrl = await googleWorkspaceService.beginAuthorization({
      organizationId: orgId,
      agentId: identity.agentId,
      userId: req.identity!.userId,
      approvedCapabilities: identity.permissions,
    });
    res.json({ success: true, authorizationUrl });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message || 'Google authorization is unavailable.' });
  }
});

identityRouter.get('/agent/:agentId/inbox', requireIdentityCapability('identity:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = organizationId(req)!;
    const identity = await ensureIdentity(orgId, req.params.agentId);
    if (!identity) return res.status(404).json({ success: false, error: 'Agent is not registered.' });
    const messages = await googleWorkspaceService.listInbox(orgId, identity.agentId);
    res.json({ success: true, agentId: identity.agentId, emailAddress: identity.emailAddress, inboxCount: messages.length, messages });
  } catch (error: any) {
    const forbidden = String(error?.message || '').includes('not been granted');
    res.status(forbidden ? 403 : 503).json({ success: false, error: forbidden ? error.message : 'Authorized mailbox is unavailable.' });
  }
});

identityRouter.post('/agent/:agentId/google/send', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.identity || (!req.identity.capabilities.includes('task:run') && !req.identity.capabilities.includes('system:admin'))) {
      return res.status(403).json({ success: false, error: 'Requires task:run.' });
    }
    const identity = await ensureIdentity(organizationId(req)!, req.params.agentId);
    if (!identity) return res.status(404).json({ success: false, error: 'Agent is not registered.' });
    await googleWorkspaceService.sendEmail({
      organizationId: identity.organizationId,
      agentId: identity.agentId,
      to: req.body?.to,
      subject: req.body?.subject,
      text: req.body?.text,
    });
    res.json({ success: true, message: 'Email sent.' });
  } catch (error: any) {
    res.status(String(error?.message || '').includes('not been granted') ? 403 : 503)
      .json({ success: false, error: String(error?.message || '').includes('not been granted') ? error.message : 'Authorized mailbox could not send the message.' });
  }
});

identityRouter.post('/agent/:agentId/inbox/receive', (_req, res) => {
  res.status(410).json({ success: false, error: 'Simulated inbox delivery is disabled. Connect an authorized Google Workspace mailbox.' });
});

identityRouter.post('/agent/:agentId/workspace/start', requireIdentityCapability('identity:manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const identity = await ensureIdentity(organizationId(req)!, req.params.agentId);
    if (!identity) return res.status(404).json({ success: false, error: 'Agent is not registered.' });
    const page = await browserService.getAgentPage(identity.agentId, identity.organizationId);
    const session = await safeBrowserSession(identity.agentId, identity.organizationId);
    if (!page) return res.status(503).json({ success: false, session, error: 'Persistent Chromium workspace could not be restored. Check Playwright, Cloud KMS, and encrypted profile availability.' });
    await digitalIdentityService.logIdentityActivity(identity.organizationId, identity.agentId, 'WORKSPACE_STARTED', 'Restored persistent isolated browser context.');
    res.json({ success: true, agentId: identity.agentId, session, message: 'Persistent browser workspace active.' });
  } catch {
    res.status(503).json({ success: false, error: 'Persistent browser workspace is unavailable.' });
  }
});

identityRouter.post('/agent/:agentId/workspace/stop', requireIdentityCapability('identity:manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const identity = await ensureIdentity(organizationId(req)!, req.params.agentId);
    if (!identity) return res.status(404).json({ success: false, error: 'Agent is not registered.' });
    const closed = await browserService.closeAgentSession(identity.agentId, identity.organizationId);
    if (!closed && browserService.getAgentSession(identity.agentId, identity.organizationId)) {
      return res.status(503).json({ success: false, error: 'Browser state could not be saved; the workspace remains open.' });
    }
    await digitalIdentityService.logIdentityActivity(identity.organizationId, identity.agentId, 'WORKSPACE_STOPPED', 'Saved encrypted browser state and released context.');
    res.json({ success: true, closed, agentId: identity.agentId, message: 'Workspace stopped.' });
  } catch {
    res.status(503).json({ success: false, error: 'Workspace could not be stopped safely.' });
  }
});

identityRouter.post('/agent/:agentId/workspace/reset', requireIdentityCapability('identity:manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const identity = await ensureIdentity(organizationId(req)!, req.params.agentId);
    if (!identity) return res.status(404).json({ success: false, error: 'Agent is not registered.' });
    const reset = await browserService.resetAgentWorkspace(identity.agentId, identity.organizationId);
    if (reset) await digitalIdentityService.logIdentityActivity(identity.organizationId, identity.agentId, 'WORKSPACE_RESET', 'Removed the encrypted browser profile.');
    res.json({ success: reset, agentId: identity.agentId, message: 'Workspace profile reset.' });
  } catch {
    res.status(503).json({ success: false, error: 'Workspace profile could not be reset.' });
  }
});

identityOAuthCallbackRouter.get('/google/callback', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  if (!code || !state || req.query.error) return res.status(400).send('Google Workspace authorization was not completed. You can close this window.');
  try {
    await googleWorkspaceService.completeAuthorization(code, state);
    res.redirect('/?workspaceConnection=complete');
  } catch {
    res.status(400).send('Google Workspace could not be connected. You can close this window and retry.');
  }
});
