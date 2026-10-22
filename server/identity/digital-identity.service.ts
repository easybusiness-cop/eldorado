import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '../../src/utils/supabaseAdmin.ts';
import { eventBus } from '../events/eventBus.ts';
import { applicationAccountManager, type ConnectedAccountRecord } from './application-account-manager.ts';

export interface IdentityActivityEvent {
  eventId: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface AgentDigitalIdentity {
  identityId: string;
  organizationId: string;
  agentId: string;
  displayName: string;
  role: string;
  emailAddress: string | null;
  emailProvider: 'google_workspace' | 'gmail_oauth' | 'internal_relay' | null;
  status: 'active' | 'provisioning' | 'suspended' | 'revoked';
  workspaceId: string;
  connectedAccounts: ConnectedAccountRecord[];
  permissions: string[];
  createdAt: string;
  lastActiveAt: string;
  history: IdentityActivityEvent[];
}

type IdentityRow = {
  identity_id: string;
  organization_id: string;
  agent_id: string;
  display_name: string;
  role: string;
  email_address: string | null;
  email_provider: AgentDigitalIdentity['emailProvider'];
  status: AgentDigitalIdentity['status'];
  workspace_id: string;
  created_at: string;
  updated_at: string;
};

function toIdentity(row: IdentityRow, workspaceId = row.workspace_id): AgentDigitalIdentity {
  return {
    identityId: row.identity_id,
    organizationId: row.organization_id,
    agentId: row.agent_id,
    displayName: row.display_name,
    role: row.role,
    emailAddress: row.email_address,
    emailProvider: row.email_provider,
    status: row.status,
    workspaceId,
    connectedAccounts: [],
    permissions: [],
    createdAt: row.created_at,
    lastActiveAt: row.updated_at,
    history: [],
  };
}

export class DigitalIdentityService {
  private static instance: DigitalIdentityService;
  private constructor() {}

  public static getInstance(): DigitalIdentityService {
    if (!DigitalIdentityService.instance) DigitalIdentityService.instance = new DigitalIdentityService();
    return DigitalIdentityService.instance;
  }

  /** Creates a permanent identity and isolated workspace once per org/agent pair. */
  public async getOrCreateIdentity(
    organizationId: string,
    agentId: string,
    options?: { displayName?: string; role?: string },
  ): Promise<AgentDigitalIdentity> {
    const org = organizationId?.trim();
    const agent = agentId?.trim().toLowerCase();
    if (!org || !agent) throw new Error('organizationId and agentId are required to allocate an identity.');

    const db = getSupabaseAdmin();
    const proposedWorkspaceId = `ws-${randomUUID()}`;
    const proposed: IdentityRow = {
      identity_id: `ident-${randomUUID()}`,
      organization_id: org,
      agent_id: agent,
      display_name: options?.displayName?.trim() || agentId.trim(),
      role: options?.role?.trim() || 'Autonomous Operational Agent',
      email_address: null,
      email_provider: null,
      status: 'provisioning',
      workspace_id: proposedWorkspaceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await db
      .from('agent_digital_identities')
      .upsert(proposed, { onConflict: 'organization_id,agent_id', ignoreDuplicates: true });
    if (insertError) throw new Error(`Identity allocation failed: ${insertError.message}`);

    const { data: row, error: identityError } = await db
      .from('agent_digital_identities')
      .select('*')
      .eq('organization_id', org)
      .eq('agent_id', agent)
      .single();
    if (identityError || !row) throw new Error(`Identity lookup failed: ${identityError?.message || 'identity missing'}`);

    const { error: workspaceError } = await db.from('agent_workspaces').upsert({
      workspace_id: row.workspace_id,
      organization_id: org,
      agent_id: agent,
      workspace_path: `encrypted-state://${row.workspace_id}`,
      storage_driver: 'playwright_storage_state',
      is_persistent: true,
      persistence_status: 'pending',
    }, { onConflict: 'workspace_id', ignoreDuplicates: true });
    if (workspaceError) throw new Error(`Workspace allocation failed: ${workspaceError.message}`);

    let identityRow = row as IdentityRow;
    if (identityRow.status === 'provisioning') {
      const { data: activated, error: activationError } = await db.from('agent_digital_identities').update({
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('organization_id', org).eq('agent_id', agent).eq('status', 'provisioning').select('*').maybeSingle();
      if (activationError) throw new Error(`Identity activation failed: ${activationError.message}`);
      if (activated) identityRow = activated as IdentityRow;
    }

    const identity = toIdentity(identityRow);
    const [permissionsResult, accounts, eventsResult] = await Promise.all([
      db.from('agent_identity_permissions').select('permission').eq('organization_id', org).eq('agent_id', agent),
      applicationAccountManager.listAccountsForAgent(org, agent),
      db.from('agent_identity_events').select('id,action,details,created_at').eq('organization_id', org).eq('agent_id', agent).order('created_at', { ascending: false }).limit(20),
    ]);
    if (permissionsResult.error) throw new Error(`Identity permission lookup failed: ${permissionsResult.error.message}`);
    if (eventsResult.error) throw new Error(`Identity activity lookup failed: ${eventsResult.error.message}`);
    identity.permissions = (permissionsResult.data ?? []).map((item) => item.permission);
    identity.connectedAccounts = accounts;
    identity.history = (eventsResult.data ?? []).map((event) => ({
      eventId: event.id,
      action: event.action,
      timestamp: event.created_at,
      details: event.details,
    }));

    if (identityRow.identity_id === proposed.identity_id) {
      eventBus.emitEvent('AGENT_IDENTITY_CREATED', { identityId: identity.identityId, organizationId: org, agentId: agent });
      await this.logIdentityActivity(org, agent, 'IDENTITY_PROVISIONED', 'Allocated persistent identity and isolated browser workspace.');
      identity.history.unshift({
        eventId: `evt-${randomUUID()}`,
        action: 'IDENTITY_PROVISIONED',
        timestamp: new Date().toISOString(),
        details: 'Allocated persistent identity and isolated browser workspace.',
      });
    }
    return identity;
  }

  public async getIdentity(organizationId: string, agentId: string): Promise<AgentDigitalIdentity | null> {
    const org = organizationId?.trim();
    const agent = agentId?.trim().toLowerCase();
    if (!org || !agent) return null;
    const db = getSupabaseAdmin();
    const { data: row, error } = await db.from('agent_digital_identities').select('*')
      .eq('organization_id', org).eq('agent_id', agent).maybeSingle();
    if (error) throw new Error(`Identity lookup failed: ${error.message}`);
    if (!row) return null;
    return this.getOrCreateIdentity(org, agent, { displayName: row.display_name, role: row.role });
  }

  public async listAllIdentities(organizationId: string): Promise<AgentDigitalIdentity[]> {
    if (!organizationId?.trim()) throw new Error('organizationId is required.');
    const db = getSupabaseAdmin();
    const { data: rows, error } = await db.from('agent_digital_identities').select('*')
      .eq('organization_id', organizationId.trim()).order('created_at', { ascending: true });
    if (error) throw new Error(`Identity list failed: ${error.message}`);
    return Promise.all((rows ?? []).map((row) => this.getOrCreateIdentity(organizationId, row.agent_id, {
      displayName: row.display_name,
      role: row.role,
    })));
  }

  public async logIdentityActivity(organizationId: string, agentId: string, action: string, details: string): Promise<void> {
    const { error } = await getSupabaseAdmin().from('agent_identity_events').insert({
      organization_id: organizationId,
      agent_id: agentId.trim().toLowerCase(),
      action: action.slice(0, 100),
      details: details.slice(0, 2000),
    });
    if (error) throw new Error(`Identity audit event failed: ${error.message}`);
  }

  public async hasPermission(organizationId: string, agentId: string, requiredPermission: string): Promise<boolean> {
    const { data, error } = await getSupabaseAdmin().from('agent_identity_permissions')
      .select('id').eq('organization_id', organizationId).eq('agent_id', agentId.trim().toLowerCase())
      .eq('permission', requiredPermission).maybeSingle();
    if (error) throw new Error(`Identity permission check failed: ${error.message}`);
    return Boolean(data);
  }
}

export const digitalIdentityService = DigitalIdentityService.getInstance();
