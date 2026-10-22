import fs from 'fs';
import path from 'path';
import { emailInfrastructureService, AgentEmailIdentity } from './email-infrastructure.service.ts';
import { applicationAccountManager, ConnectedAccountRecord, PlatformType } from './application-account-manager.ts';
import { eventBus } from '../events/eventBus.ts';

export interface IdentityActivityEvent {
  eventId: string;
  action: string;
  timestamp: string;
  details: string;
  sourceIp?: string;
}

export interface AgentDigitalIdentity {
  identityId: string;
  organizationId: string;
  agentId: string;
  displayName: string;
  role: string;
  emailAddress: string;
  emailProvider: 'google_workspace' | 'gmail_oauth' | 'internal_relay';
  status: 'active' | 'provisioning' | 'suspended' | 'revoked';
  workspaceId: string;
  workspacePath: string;
  connectedAccounts: ConnectedAccountRecord[];
  permissions: string[];
  createdAt: string;
  lastActiveAt: string;
  history: IdentityActivityEvent[];
}

export class DigitalIdentityService {
  private static instance: DigitalIdentityService;
  private identities: Map<string, AgentDigitalIdentity> = new Map();
  private storageDir: string;
  private storageFile: string;

  private constructor() {
    this.storageDir = path.resolve(process.cwd(), '.rufflo-identities');
    this.storageFile = path.join(this.storageDir, 'identities.json');

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    this.loadIdentities();
    this.autoBootstrapKnownFleet();
  }

  public static getInstance(): DigitalIdentityService {
    if (!DigitalIdentityService.instance) {
      DigitalIdentityService.instance = new DigitalIdentityService();
    }
    return DigitalIdentityService.instance;
  }

  private getKey(orgId: string, agentId: string): string {
    return `${(orgId || 'org-alpha').toLowerCase().trim()}:${agentId.toLowerCase().trim()}`;
  }

  private loadIdentities() {
    if (fs.existsSync(this.storageFile)) {
      try {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const list: AgentDigitalIdentity[] = JSON.parse(raw);
        for (const item of list) {
          this.identities.set(this.getKey(item.organizationId, item.agentId), item);
        }
      } catch (err: any) {
        console.warn(`[DigitalIdentityService] Error loading stored identities: ${err.message}`);
      }
    }
  }

  private persistIdentities() {
    try {
      const list = Array.from(this.identities.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(list, null, 2), 'utf8');
    } catch (err: any) {
      console.error(`[DigitalIdentityService] Failed to persist identities: ${err.message}`);
    }
  }

  /**
   * Automatically bootstrap permanent digital identities for core workforce fleet
   */
  private autoBootstrapKnownFleet() {
    const knownFleet = [
      { id: 'michael', name: 'Michael Scott', role: 'Regional Manager & CEO', permissions: ['*'] },
      { id: 'dwight', name: 'Dwight Schrute', role: 'Assistant Regional Manager & CISO', permissions: ['security:audit', 'browser:persist', 'accounts:manage'] },
      { id: 'jim', name: 'Jim Halpert', role: 'Client Relations & Sales Specialist', permissions: ['browser:persist', 'accounts:manage'] },
      { id: 'pam', name: 'Pam Beesly', role: 'Office Administrator & UX Director', permissions: ['browser:persist', 'accounts:manage'] },
      { id: 'pete-miller', name: 'Pete Miller', role: 'Chief Enterprise Architect', permissions: ['*'] },
      { id: 'roy', name: 'Roy Anderson', role: 'DevOps & Deployment SRE', permissions: ['deployment:write', 'browser:persist'] },
      { id: 'toby', name: 'Toby Flenderson', role: 'Compliance & Self-Healing SRE', permissions: ['compliance:audit', 'browser:persist'] },
      { id: 'CoreCoder', name: 'CoreCoder', role: 'Polyglot Systems Engineer', permissions: ['task:run', 'browser:persist'] },
      { id: 'ChromiumNavigator', name: 'ChromiumNavigator', role: 'Autonomous Web OSINT Radar', permissions: ['browser:persist', 'accounts:manage'] },
    ];

    for (const ag of knownFleet) {
      this.getOrCreateIdentity('org-alpha', ag.id, {
        displayName: ag.name,
        role: ag.role,
        permissions: ag.permissions,
      });
    }
  }

  /**
   * Get or create a permanent digital identity for an agent in an organization
   */
  public getOrCreateIdentity(
    orgId: string,
    agentId: string,
    options?: {
      displayName?: string;
      role?: string;
      permissions?: string[];
      emailProvider?: 'google_workspace' | 'gmail_oauth' | 'internal_relay';
    }
  ): AgentDigitalIdentity {
    const org = (orgId || 'org-alpha').toLowerCase().trim();
    const agent = agentId.toLowerCase().trim();
    const key = this.getKey(org, agent);

    const existing = this.identities.get(key);
    if (existing) {
      existing.connectedAccounts = applicationAccountManager.listAccountsForAgent(org, agent);
      return existing;
    }

    const emailIdent = emailInfrastructureService.allocateEmailIdentity(org, agent, {
      provider: options?.emailProvider || 'google_workspace',
    });

    const workspaceId = `ws-${org}-${agent}`;
    const workspacePath = path.resolve(process.cwd(), `.rufflo-workspaces/${org}/${agent}`);

    const newIdentity: AgentDigitalIdentity = {
      identityId: `ident-${org}-${agent}`,
      organizationId: org,
      agentId: agent,
      displayName: options?.displayName || agentId,
      role: options?.role || 'Autonomous Operational Agent',
      emailAddress: emailIdent.emailAddress,
      emailProvider: emailIdent.provider,
      status: 'active',
      workspaceId,
      workspacePath,
      connectedAccounts: applicationAccountManager.listAccountsForAgent(org, agent),
      permissions: options?.permissions || ['browser:persist', 'accounts:manage', 'tools:execute'],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      history: [
        {
          eventId: `evt-init-${Date.now()}`,
          action: 'IDENTITY_PROVISIONED',
          timestamp: new Date().toISOString(),
          details: `Provisioned individual digital identity with email ${emailIdent.emailAddress}.`,
        },
      ],
    };

    this.identities.set(key, newIdentity);
    this.persistIdentities();

    eventBus.emitEvent('AGENT_IDENTITY_CREATED', {
      identityId: newIdentity.identityId,
      organizationId: org,
      agentId: agent,
      emailAddress: newIdentity.emailAddress,
    });

    return newIdentity;
  }

  public getIdentity(orgId: string, agentId: string): AgentDigitalIdentity | null {
    const key = this.getKey(orgId, agentId);
    const id = this.identities.get(key);
    if (id) {
      id.connectedAccounts = applicationAccountManager.listAccountsForAgent(orgId, agentId);
    }
    return id || null;
  }

  public listAllIdentities(orgId?: string): AgentDigitalIdentity[] {
    const list: AgentDigitalIdentity[] = [];
    const targetOrg = orgId?.toLowerCase().trim();

    for (const id of this.identities.values()) {
      if (!targetOrg || id.organizationId === targetOrg) {
        id.connectedAccounts = applicationAccountManager.listAccountsForAgent(id.organizationId, id.agentId);
        list.push(id);
      }
    }
    return list;
  }

  /**
   * Log an activity event to an agent's immutable identity history
   */
  public logIdentityActivity(
    orgId: string,
    agentId: string,
    action: string,
    details: string
  ): void {
    const ident = this.getIdentity(orgId, agentId);
    if (!ident) return;

    ident.history.unshift({
      eventId: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      timestamp: new Date().toISOString(),
      details,
    });

    if (ident.history.length > 50) ident.history.pop();
    ident.lastActiveAt = new Date().toISOString();
    this.persistIdentities();
  }

  /**
   * Check if agent has a specific permission
   */
  public hasPermission(orgId: string, agentId: string, requiredPermission: string): boolean {
    const ident = this.getIdentity(orgId, agentId);
    if (!ident) return false;
    if (ident.permissions.includes('*')) return true;
    return ident.permissions.includes(requiredPermission);
  }
}

export const digitalIdentityService = DigitalIdentityService.getInstance();
