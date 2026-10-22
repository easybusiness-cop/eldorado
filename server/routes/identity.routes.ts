import { Router } from 'express';
import { digitalIdentityService } from '../identity/digital-identity.service.ts';
import { emailInfrastructureService } from '../identity/email-infrastructure.service.ts';
import { applicationAccountManager, PlatformType } from '../identity/application-account-manager.ts';
import { browserService } from '../tools/browser/browser.service.ts';

export const identityRouter = Router();

// 1. List all agent identities in an organization
identityRouter.get('/agents', async (req, res) => {
  try {
    const orgId = (req.headers['x-organization-id'] as string) || (req.query.orgId as string) || 'org-alpha';
    const identities = digitalIdentityService.listAllIdentities(orgId);
    
    // Enrich with live browser session summary
    const enriched = identities.map((id) => {
      const browserSession = browserService.getAgentSession(id.agentId, orgId);
      return {
        ...id,
        browserSession: browserSession || {
          status: 'idle',
          isPersistent: true,
          cookiesCount: 0,
          currentUrl: 'about:blank',
        },
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      organizationId: orgId,
      identities: enriched,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get specific agent identity details
identityRouter.get('/agent/:agentId', async (req, res) => {
  try {
    const orgId = (req.headers['x-organization-id'] as string) || (req.query.orgId as string) || 'org-alpha';
    const agentId = req.params.agentId;

    const identity = digitalIdentityService.getOrCreateIdentity(orgId, agentId);
    const browserSession = browserService.getAgentSession(agentId, orgId);
    const inbox = emailInfrastructureService.getAgentInbox(orgId, agentId);

    res.json({
      success: true,
      identity: {
        ...identity,
        browserSession: browserSession || {
          status: 'idle',
          isPersistent: true,
          cookiesCount: 0,
          currentUrl: 'about:blank',
        },
        recentEmailsCount: inbox.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Request external application account provisioning
identityRouter.post('/agent/:agentId/provision-account', async (req, res) => {
  try {
    const orgId = (req.headers['x-organization-id'] as string) || req.body.organizationId || 'org-alpha';
    const agentId = req.params.agentId;
    const { platform, accountHandle, desiredPassword } = req.body;

    if (!platform) {
      return res.status(400).json({ success: false, error: 'Platform is required (e.g. linkedin, canva, youtube, github)' });
    }

    const identity = digitalIdentityService.getOrCreateIdentity(orgId, agentId);
    const result = await applicationAccountManager.provisionAccount(
      {
        agentId,
        organizationId: orgId,
        platform: platform as PlatformType,
        accountHandle: accountHandle || `${agentId}_${platform}`,
        desiredPassword,
      },
      identity.permissions
    );

    if (!result.success) {
      digitalIdentityService.logIdentityActivity(
        orgId,
        agentId,
        'ACCOUNT_PROVISION_DENIED',
        `Provisioning for ${platform} denied: ${result.error}`
      );
      return res.status(403).json(result);
    }

    digitalIdentityService.logIdentityActivity(
      orgId,
      agentId,
      'ACCOUNT_PROVISIONED',
      `Provisioned account for platform ${platform}. Requires human assistance: ${result.requiresHumanAssistance}`
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Check agent email inbox and extracted OTP verification codes
identityRouter.get('/agent/:agentId/inbox', async (req, res) => {
  try {
    const orgId = (req.headers['x-organization-id'] as string) || (req.query.orgId as string) || 'org-alpha';
    const agentId = req.params.agentId;
    const inbox = emailInfrastructureService.getAgentInbox(orgId, agentId);
    const latestOtp = emailInfrastructureService.getLatestOtpForAgent(orgId, agentId);

    res.json({
      success: true,
      agentId,
      emailAddress: `${agentId}@dundermifflin.internal`,
      inboxCount: inbox.length,
      latestOtp,
      messages: inbox,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Simulate/receive verification email
identityRouter.post('/agent/:agentId/inbox/receive', async (req, res) => {
  try {
    const orgId = (req.headers['x-organization-id'] as string) || req.body.organizationId || 'org-alpha';
    const agentId = req.params.agentId;
    const { sender, subject, body } = req.body;

    if (!sender || !subject || !body) {
      return res.status(400).json({ success: false, error: 'sender, subject, and body are required' });
    }

    const emailMsg = emailInfrastructureService.receiveIncomingEmail(orgId, agentId, {
      sender,
      subject,
      body,
    });

    // If OTP found, log activity
    if (emailMsg.extraction.hasOtp) {
      digitalIdentityService.logIdentityActivity(
        orgId,
        agentId,
        'OTP_EXTRACTED',
        `Extracted OTP: ${emailMsg.extraction.otpCode || 'Verification Link'} from ${sender}`
      );
    }

    res.json({ success: true, email: emailMsg });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Persistent Browser Workspace Start
identityRouter.post('/agent/:agentId/workspace/start', async (req, res) => {
  try {
    const orgId = (req.headers['x-organization-id'] as string) || req.body.organizationId || 'org-alpha';
    const agentId = req.params.agentId;

    const page = await browserService.getAgentPage(agentId, orgId);
    const session = browserService.getAgentSession(agentId, orgId);

    digitalIdentityService.logIdentityActivity(
      orgId,
      agentId,
      'WORKSPACE_STARTED',
      `Restored persistent browser context with ${session?.cookiesCount || 0} active cookies.`
    );

    res.json({
      success: Boolean(page),
      agentId,
      session,
      message: 'Persistent browser workspace active.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Persistent Browser Workspace Stop
identityRouter.post('/agent/:agentId/workspace/stop', async (req, res) => {
  try {
    const orgId = (req.headers['x-organization-id'] as string) || req.body.organizationId || 'org-alpha';
    const agentId = req.params.agentId;

    const closed = await browserService.closeAgentSession(agentId, orgId);

    digitalIdentityService.logIdentityActivity(
      orgId,
      agentId,
      'WORKSPACE_STOPPED',
      `Saved storage state to disk and released context.`
    );

    res.json({ success: true, closed, agentId, message: 'Persistent workspace stopped and state preserved.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Persistent Browser Workspace Reset (wipe cookies & storageState)
identityRouter.post('/agent/:agentId/workspace/reset', async (req, res) => {
  try {
    const orgId = (req.headers['x-organization-id'] as string) || req.body.organizationId || 'org-alpha';
    const agentId = req.params.agentId;

    const reset = await browserService.resetAgentWorkspace(agentId, orgId);

    digitalIdentityService.logIdentityActivity(
      orgId,
      agentId,
      'WORKSPACE_RESET',
      `Wiped persistent cookies, local storage, and profile state.`
    );

    res.json({ success: reset, agentId, message: 'Workspace profile reset cleanly.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Resolve Human Assistance (CAPTCHA / SMS gate)
identityRouter.post('/agent/:agentId/resolve-assistance', async (req, res) => {
  try {
    const orgId = (req.headers['x-organization-id'] as string) || req.body.organizationId || 'org-alpha';
    const agentId = req.params.agentId;
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({ success: false, error: 'Platform is required' });
    }

    const resolved = applicationAccountManager.resolveHumanAssistance(orgId, agentId, platform as PlatformType);

    if (resolved) {
      digitalIdentityService.logIdentityActivity(
        orgId,
        agentId,
        'HUMAN_ASSISTANCE_RESOLVED',
        `Human supervisor cleared verification gate for platform ${platform}.`
      );
    }

    res.json({ success: resolved, agentId, platform });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
