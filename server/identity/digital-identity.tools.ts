import { getSupabaseAdmin } from '../../src/utils/supabaseAdmin.ts';
import { applicationAccountManager, type PlatformType } from './application-account-manager.ts';
import { digitalIdentityService } from './digital-identity.service.ts';
import { googleWorkspaceService } from './google-workspace.service.ts';
import { browserService } from '../tools/browser/browser.service.ts';
import type { MastraToolDefinition } from '../ai/mastra/tools/index.ts';

const REQUESTABLE_CAPABILITIES = new Set([
  'gmail:read', 'gmail:send', 'accounts:manage', 'accounts:linkedin', 'accounts:instagram',
  'accounts:youtube', 'accounts:canva', 'accounts:github', 'accounts:x_twitter', 'accounts:custom',
  'browser:persist', 'browser:inspect',
]);
const PLATFORMS = new Set<PlatformType>([
  'linkedin', 'instagram', 'youtube', 'canva', 'github', 'x_twitter', 'custom', 'google_workspace',
]);

function requiredString(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`${name} must contain 1 to ${maxLength} characters.`);
  }
  return value.trim();
}

async function requireAgentPermission(orgId: string, agentId: string, permission: string): Promise<void> {
  if (!(await digitalIdentityService.hasPermission(orgId, agentId, permission))) {
    throw new Error(`The agent has not been granted ${permission}. Request it from the Identity Manager first.`);
  }
}

export const digitalIdentityTools: MastraToolDefinition[] = [
  {
    name: 'identity.get_profile',
    description: 'Read this agent’s organization-scoped digital identity, authorized mailbox address, connected account states, and approved capabilities.',
    category: 'system',
    requiresAuth: true,
    requiredPermission: 'identity:read',
    execute: async (_params, context) => {
      const identity = await digitalIdentityService.getOrCreateIdentity(context.orgId, context.agentId);
      return {
        identityId: identity.identityId,
        organizationId: identity.organizationId,
        agentId: identity.agentId,
        displayName: identity.displayName,
        mailbox: identity.emailAddress,
        emailProvider: identity.emailProvider,
        connectedAccounts: identity.connectedAccounts,
        capabilities: identity.permissions,
        workspaceId: identity.workspaceId,
      };
    },
  },
  {
    name: 'identity.request_capability',
    description: 'Request an organization manager to approve a digital capability for this agent. Requests do not grant access until approved.',
    category: 'security',
    requiresAuth: true,
    requiredPermission: 'identity:request',
    execute: async (params, context) => {
      const capability = requiredString(params.capability, 'capability', 150);
      const reason = requiredString(params.reason, 'reason', 2000);
      if (reason.length < 8 || !REQUESTABLE_CAPABILITIES.has(capability)) {
        throw new Error('The capability is not requestable or the reason is too short.');
      }
      const db = getSupabaseAdmin();
      const identity = await digitalIdentityService.getOrCreateIdentity(context.orgId, context.agentId);
      if (identity.permissions.includes(capability)) return { status: 'approved', capability };
      const { data: existing, error: lookupError } = await db.from('agent_identity_capability_requests').select('id,status')
        .eq('organization_id', context.orgId).eq('agent_id', identity.agentId)
        .eq('capability', capability).eq('status', 'pending').maybeSingle();
      if (lookupError) throw new Error('Capability request lookup failed.');
      if (existing) return { requestId: existing.id, status: existing.status, capability };
      const { data, error } = await db.from('agent_identity_capability_requests').insert({
        organization_id: context.orgId,
        agent_id: identity.agentId,
        capability,
        reason,
        status: 'pending',
        requested_by: identity.agentId,
      }).select('id,status,capability').single();
      if (error || !data) throw new Error('Capability request could not be submitted to the Identity Manager.');
      await digitalIdentityService.logIdentityActivity(context.orgId, identity.agentId, 'CAPABILITY_REQUESTED', `Requested capability ${capability}.`);
      return { requestId: data.id, status: data.status, capability: data.capability };
    },
  },
  {
    name: 'accounts.request_access',
    description: 'Request organization approval to use an existing external account. Rufflo does not create accounts on third-party services.',
    category: 'external',
    requiresAuth: true,
    requiredPermission: 'accounts:request',
    execute: async (params, context) => {
      const platform = requiredString(params.platform, 'platform', 50) as PlatformType;
      const accountHandle = requiredString(params.accountHandle, 'accountHandle', 150);
      if (!PLATFORMS.has(platform)) throw new Error('The requested external platform is not supported.');
      const identity = await digitalIdentityService.getOrCreateIdentity(context.orgId, context.agentId);
      const result = await applicationAccountManager.provisionAccount({
        organizationId: context.orgId,
        agentId: identity.agentId,
        platform,
        accountHandle,
      }, identity.permissions);
      if (!result.success) throw new Error(result.error || 'Account access request was rejected.');
      await digitalIdentityService.logIdentityActivity(context.orgId, identity.agentId, 'ACCOUNT_ACCESS_REQUESTED', `Requested authorized ${platform} account access.`);
      return { success: true, account: result.account, message: 'Access request recorded; approval and provider authorization are still required.' };
    },
  },
  {
    name: 'gmail.list_inbox',
    description: 'Read headers from this agent’s authorized Google Workspace inbox. Message bodies and verification codes are not returned.',
    category: 'external',
    requiresAuth: true,
    requiredPermission: 'gmail:read',
    execute: async (_params, context) => ({
      messages: await googleWorkspaceService.listInbox(context.orgId, context.agentId),
    }),
  },
  {
    name: 'gmail.send',
    description: 'Send an email from this agent’s authorized Workspace mailbox. External sending remains subject to Rufflo risk approval and Gmail send authorization.',
    category: 'external',
    requiresAuth: true,
    requiredPermission: 'gmail:send',
    execute: async (params, context) => {
      await requireAgentPermission(context.orgId, context.agentId, 'gmail:send');
      await googleWorkspaceService.sendEmail({
        organizationId: context.orgId,
        agentId: context.agentId,
        to: requiredString(params.to, 'to', 320),
        subject: requiredString(params.subject, 'subject', 500),
        text: requiredString(params.text, 'text', 20_000),
      });
      return { success: true, message: 'Email sent.' };
    },
  },
  {
    name: 'browser.navigate',
    description: 'Navigate in this agent’s isolated persistent Playwright browser workspace. Requires the approved browser:persist capability.',
    category: 'external',
    requiresAuth: true,
    requiredPermission: 'browser:persist',
    execute: async (params, context) => {
      await requireAgentPermission(context.orgId, context.agentId, 'browser:persist');
      const url = requiredString(params.url, 'url', 4096);
      return browserService.browseAsAgent(context.agentId, url, context.orgId);
    },
  },
  {
    name: 'browser.click',
    description: 'Click an element in this agent’s isolated persistent Playwright browser workspace.',
    category: 'external',
    requiresAuth: true,
    requiredPermission: 'browser:persist',
    execute: async (params, context) => {
      await requireAgentPermission(context.orgId, context.agentId, 'browser:persist');
      return browserService.clickAsAgent(context.agentId, requiredString(params.selector, 'selector', 1000), context.orgId);
    },
  },
  {
    name: 'browser.type',
    description: 'Fill a field in this agent’s isolated persistent Playwright browser workspace. Typed values are never echoed in the result.',
    category: 'external',
    requiresAuth: true,
    requiredPermission: 'browser:persist',
    execute: async (params, context) => {
      await requireAgentPermission(context.orgId, context.agentId, 'browser:persist');
      const selector = requiredString(params.selector, 'selector', 1000);
      if (typeof params.value !== 'string') throw new Error('value must be a string.');
      return browserService.typeAsAgent(context.agentId, selector, params.value, context.orgId);
    },
  },
];
