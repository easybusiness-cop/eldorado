import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '../../src/utils/supabaseAdmin.ts';

export type PlatformType = 'linkedin' | 'instagram' | 'youtube' | 'canva' | 'github' | 'x_twitter' | 'custom' | 'google_workspace';
const PLATFORMS = new Set<PlatformType>(['linkedin', 'instagram', 'youtube', 'canva', 'github', 'x_twitter', 'custom', 'google_workspace']);

export interface ConnectedAccountRecord {
  id: string;
  agentId: string;
  organizationId: string;
  platform: PlatformType;
  accountHandle: string;
  emailUsed: string | null;
  status: 'requested' | 'denied' | 'provisioned' | 'pending_verification' | 'pending_human_assistance' | 'active' | 'suspended' | 'revoked';
  authorizationStatus: 'requested' | 'approved' | 'denied' | 'revoked';
  requiresHumanAssistance: boolean;
  assistanceReason?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface AccountProvisioningRequest {
  agentId: string;
  organizationId: string;
  platform: PlatformType;
  accountHandle: string;
  requestedBy?: string;
}

export class ApplicationAccountManager {
  private static instance: ApplicationAccountManager;
  private constructor() {}

  public static getInstance(): ApplicationAccountManager {
    if (!ApplicationAccountManager.instance) ApplicationAccountManager.instance = new ApplicationAccountManager();
    return ApplicationAccountManager.instance;
  }

  public async getAccount(orgId: string, agentId: string, platform: PlatformType): Promise<ConnectedAccountRecord | null> {
    const { data, error } = await getSupabaseAdmin().from('agent_connected_accounts').select('*')
      .eq('organization_id', orgId).eq('agent_id', agentId.trim().toLowerCase()).eq('platform', platform)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(`Account lookup failed: ${error.message}`);
    return data ? this.mapRow(data) : null;
  }

  public async getAccountById(orgId: string, accountId: string): Promise<ConnectedAccountRecord | null> {
    const { data, error } = await getSupabaseAdmin().from('agent_connected_accounts').select('*')
      .eq('organization_id', orgId).eq('account_id', accountId).maybeSingle();
    if (error) throw new Error('Connected account lookup failed.');
    return data ? this.mapRow(data) : null;
  }

  public async listAccountsForAgent(orgId: string, agentId: string): Promise<ConnectedAccountRecord[]> {
    const { data, error } = await getSupabaseAdmin().from('agent_connected_accounts').select('*')
      .eq('organization_id', orgId).eq('agent_id', agentId.trim().toLowerCase()).order('created_at', { ascending: false });
    if (error) throw new Error(`Connected account list failed: ${error.message}`);
    return (data ?? []).map((row) => this.mapRow(row));
  }

  public async decideAccessRequest(input: {
    organizationId: string;
    accountId: string;
    approved: boolean;
    decidedBy: string;
  }): Promise<ConnectedAccountRecord | null> {
    const db = getSupabaseAdmin();
    const { data: pending, error: lookupError } = await db.from('agent_connected_accounts').select('*')
      .eq('organization_id', input.organizationId).eq('account_id', input.accountId).eq('status', 'requested').maybeSingle();
    if (lookupError) throw new Error('Account request lookup failed.');
    if (!pending) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.decidedBy);
    const { data, error } = await db.from('agent_connected_accounts').update({
      authorization_status: input.approved ? 'approved' : 'denied',
      status: input.approved ? 'pending_human_assistance' : 'denied',
      requires_human_assistance: input.approved,
      assistance_reason: input.approved
        ? 'An organization manager approved access. Complete the provider’s official authorization flow; no account was created.'
        : null,
      approved_by: input.approved && isUuid ? input.decidedBy : null,
    }).eq('organization_id', input.organizationId).eq('account_id', input.accountId).eq('status', 'requested')
      .select('*').maybeSingle();
    if (error) throw new Error('Account request decision could not be saved.');
    return data ? this.mapRow(data) : null;
  }

  public async confirmProviderAuthorization(input: {
    organizationId: string;
    accountId: string;
    confirmedBy: string;
    browserSessionId: string;
  }): Promise<ConnectedAccountRecord | null> {
    const db = getSupabaseAdmin();
    const { data: pending, error: lookupError } = await db.from('agent_connected_accounts').select('agent_id,status,authorization_status')
      .eq('organization_id', input.organizationId).eq('account_id', input.accountId)
      .eq('status', 'pending_human_assistance').eq('authorization_status', 'approved').maybeSingle();
    if (lookupError) throw new Error('Account authorization lookup failed.');
    if (!pending) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.confirmedBy);
    const { data, error } = await db.from('agent_connected_accounts').update({
      status: 'active',
      requires_human_assistance: false,
      assistance_reason: null,
      browser_session_id: input.browserSessionId.slice(0, 150),
      connected_confirmed_by: isUuid ? input.confirmedBy : null,
      connected_confirmed_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    }).eq('organization_id', input.organizationId).eq('account_id', input.accountId)
      .eq('status', 'pending_human_assistance').eq('authorization_status', 'approved')
      .select('*').maybeSingle();
    if (error) throw new Error('Provider authorization confirmation could not be saved.');
    return data ? this.mapRow(data) : null;
  }

  /** Creates a pending registry request only; it never creates accounts on a third-party service. */
  public async provisionAccount(
    req: AccountProvisioningRequest,
    agentPermissions: string[] = [],
  ): Promise<{ success: boolean; account?: ConnectedAccountRecord; error?: string }> {
    if (!PLATFORMS.has(req.platform)) return { success: false, error: 'Unsupported account provider.' };
    if (!req.accountHandle?.trim() || req.accountHandle.trim().length > 150) {
      return { success: false, error: 'An account identifier between 1 and 150 characters is required.' };
    }
    if (!agentPermissions.includes(`accounts:${req.platform}`) && !agentPermissions.includes('accounts:manage')) {
      return { success: false, error: 'The agent has not been granted permission to request this account provider.' };
    }

    const agent = req.agentId.trim().toLowerCase();
    const { data: existing, error: lookupError } = await getSupabaseAdmin().from('agent_connected_accounts').select('*')
      .eq('organization_id', req.organizationId).eq('agent_id', agent).eq('platform', req.platform)
      .eq('account_handle', req.accountHandle.trim())
      .maybeSingle();
    if (lookupError) throw new Error(`Account request lookup failed: ${lookupError.message}`);
    if (existing) {
      if (existing.authorization_status === 'denied') {
        const { data: resubmitted, error } = await getSupabaseAdmin().from('agent_connected_accounts').update({
          status: 'requested',
          authorization_status: 'requested',
          requires_human_assistance: false,
          assistance_reason: null,
          requested_by: isUuid(req.requestedBy) ? req.requestedBy : null,
        }).eq('organization_id', req.organizationId).eq('account_id', existing.account_id).select('*').single();
        if (error) throw new Error('Account request could not be resubmitted.');
        return { success: true, account: this.mapRow(resubmitted) };
      }
      return { success: true, account: this.mapRow(existing) };
    }

    const row = {
      account_id: `acc-${randomUUID()}`,
      organization_id: req.organizationId,
      agent_id: agent,
      platform: req.platform,
      account_handle: req.accountHandle.trim().slice(0, 150),
      email_used: null,
      status: 'requested',
      authorization_status: 'requested',
      requires_human_assistance: false,
      assistance_reason: null,
      browser_session_id: null,
      requested_by: isUuid(req.requestedBy) ? req.requestedBy : null,
    };
    const { data, error } = await getSupabaseAdmin().from('agent_connected_accounts')
      .upsert(row, { onConflict: 'organization_id,agent_id,platform,account_handle', ignoreDuplicates: true }).select('*').single();
    if (error || !data) {
      const { data: raced, error: racedError } = await getSupabaseAdmin().from('agent_connected_accounts').select('*')
        .eq('organization_id', req.organizationId).eq('agent_id', agent).eq('platform', req.platform)
        .eq('account_handle', req.accountHandle.trim()).maybeSingle();
      if (racedError || !raced) throw new Error('Account request could not be recorded.');
      return { success: true, account: this.mapRow(raced) };
    }
    return { success: true, account: this.mapRow(data) };
  }

  private mapRow(row: Record<string, any>): ConnectedAccountRecord {
    return {
      id: row.account_id,
      agentId: row.agent_id,
      organizationId: row.organization_id,
      platform: row.platform,
      accountHandle: row.account_handle,
      emailUsed: row.email_used ?? null,
      status: row.status,
      authorizationStatus: row.authorization_status ?? 'requested',
      requiresHumanAssistance: row.requires_human_assistance,
      assistanceReason: row.assistance_reason ?? undefined,
      createdAt: row.created_at,
      lastActiveAt: row.last_active_at,
    };
  }
}

function isUuid(value?: string): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export const applicationAccountManager = ApplicationAccountManager.getInstance();
