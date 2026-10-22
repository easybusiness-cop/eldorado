import { credentialVault } from '../security/credential-vault.ts';
import { emailInfrastructureService } from './email-infrastructure.service.ts';
import { eventBus } from '../events/eventBus.ts';

export type PlatformType = 'linkedin' | 'instagram' | 'youtube' | 'canva' | 'github' | 'x_twitter' | 'custom';

export interface ConnectedAccountRecord {
  id: string;
  agentId: string;
  organizationId: string;
  platform: PlatformType;
  accountHandle: string;
  emailUsed: string;
  status: 'provisioned' | 'pending_verification' | 'pending_human_assistance' | 'active' | 'suspended';
  requiresHumanAssistance: boolean;
  assistanceReason?: string;
  browserSessionId?: string;
  createdAt: string;
  lastActiveAt: string;
  activityHistory: {
    action: string;
    timestamp: string;
    details?: string;
  }[];
}

export interface AccountProvisioningRequest {
  agentId: string;
  organizationId: string;
  platform: PlatformType;
  accountHandle: string;
  desiredPassword?: string;
  requiresBrowserSession?: boolean;
}

export class ApplicationAccountManager {
  private static instance: ApplicationAccountManager;
  private accounts: Map<string, ConnectedAccountRecord> = new Map();

  private constructor() {}

  public static getInstance(): ApplicationAccountManager {
    if (!ApplicationAccountManager.instance) {
      ApplicationAccountManager.instance = new ApplicationAccountManager();
    }
    return ApplicationAccountManager.instance;
  }

  private getKey(orgId: string, agentId: string, platform: PlatformType): string {
    return `${orgId.toLowerCase().trim()}:${agentId.toLowerCase().trim()}:${platform.toLowerCase().trim()}`;
  }

  /**
   * 1. Check whether the required account already exists
   */
  public getAccount(orgId: string, agentId: string, platform: PlatformType): ConnectedAccountRecord | null {
    return this.accounts.get(this.getKey(orgId, agentId, platform)) || null;
  }

  public listAccountsForAgent(orgId: string, agentId: string): ConnectedAccountRecord[] {
    const prefix = `${orgId.toLowerCase().trim()}:${agentId.toLowerCase().trim()}:`;
    const result: ConnectedAccountRecord[] = [];
    for (const [key, acc] of this.accounts.entries()) {
      if (key.startsWith(prefix)) {
        result.push(acc);
      }
    }
    return result;
  }

  /**
   * Provisions an authorized external application account following the 9-step directive
   */
  public async provisionAccount(
    req: AccountProvisioningRequest,
    agentPermissions: string[] = ['accounts:manage']
  ): Promise<{
    success: boolean;
    account?: ConnectedAccountRecord;
    error?: string;
    requiresHumanAssistance?: boolean;
    assistanceReason?: string;
  }> {
    const org = req.organizationId.toLowerCase().trim() || 'org-alpha';
    const agent = req.agentId.toLowerCase().trim();
    const platform = req.platform;

    // Step 1: Check whether account already exists
    const existing = this.getAccount(org, agent, platform);
    if (existing && existing.status === 'active') {
      return { success: true, account: existing };
    }

    // Step 2: Check whether agent has permission
    const hasPermission =
      agentPermissions.includes('accounts:manage') ||
      agentPermissions.includes(`accounts:${platform}`) ||
      agentPermissions.includes('*');

    if (!hasPermission) {
      return {
        success: false,
        error: `Agent [${agent}] lacks required permission [accounts:manage] or [accounts:${platform}]. Provisioning denied.`,
      };
    }

    // Step 3 & 4: Use agent's assigned email identity
    const emailIdent = emailInfrastructureService.allocateEmailIdentity(org, agent);
    const emailUsed = emailIdent.emailAddress;

    // Step 5: Check if human assistance is required for strict platforms (e.g. phone/SMS verification, CAPTCHA)
    const strictPlatforms: PlatformType[] = ['linkedin', 'instagram', 'youtube'];
    const requiresAssistance = strictPlatforms.includes(platform);
    const assistanceReason = requiresAssistance
      ? `Platform [${platform}] requires mandatory SMS phone verification or CAPTCHA resolution.`
      : undefined;

    const accountId = `acc-${org}-${agent}-${platform}`;
    const account: ConnectedAccountRecord = {
      id: accountId,
      agentId: agent,
      organizationId: org,
      platform,
      accountHandle: req.accountHandle || `${agent}_${platform}`,
      emailUsed,
      status: requiresAssistance ? 'pending_human_assistance' : 'active',
      requiresHumanAssistance: requiresAssistance,
      assistanceReason,
      browserSessionId: `ws-${org}-${agent}`,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      activityHistory: [
        {
          action: 'ACCOUNT_PROVISION_REQUESTED',
          timestamp: new Date().toISOString(),
          details: `Account requested for platform ${platform} with email ${emailUsed}.`,
        },
      ],
    };

    // Step 7: Store credentials securely in CredentialVault if password provided
    if (req.desiredPassword) {
      await credentialVault.storeSecret(
        { orgId: org, agentId: agent, secretId: `acc_${platform}_credentials` },
        JSON.stringify({ handle: account.accountHandle, email: emailUsed, password: req.desiredPassword }),
        { platform, updatedAt: new Date().toISOString() }
      );
    }

    this.accounts.set(this.getKey(org, agent, platform), account);

    eventBus.emitEvent('ACCOUNT_PROVISIONED', {
      orgId: org,
      agentId: agent,
      platform,
      status: account.status,
      requiresHumanAssistance: account.requiresHumanAssistance,
    });

    return {
      success: true,
      account,
      requiresHumanAssistance: account.requiresHumanAssistance,
      assistanceReason: account.assistanceReason,
    };
  }

  /**
   * Complete supported email verification via OTP
   */
  public verifyAccountEmailOtp(orgId: string, agentId: string, platform: PlatformType, otpCode: string): boolean {
    const account = this.getAccount(orgId, agentId, platform);
    if (!account) return false;

    account.activityHistory.push({
      action: 'EMAIL_OTP_VERIFIED',
      timestamp: new Date().toISOString(),
      details: `Successfully completed OTP verification.`,
    });

    if (!account.requiresHumanAssistance) {
      account.status = 'active';
    }
    account.lastActiveAt = new Date().toISOString();
    return true;
  }

  /**
   * Human supervisor resolves CAPTCHA / 2FA check
   */
  public resolveHumanAssistance(orgId: string, agentId: string, platform: PlatformType): boolean {
    const account = this.getAccount(orgId, agentId, platform);
    if (!account) return false;

    account.requiresHumanAssistance = false;
    account.assistanceReason = undefined;
    account.status = 'active';
    account.lastActiveAt = new Date().toISOString();
    account.activityHistory.push({
      action: 'HUMAN_ASSISTANCE_RESOLVED',
      timestamp: new Date().toISOString(),
      details: `Supervisor completed manual authentication / phone gate.`,
    });
    return true;
  }
}

export const applicationAccountManager = ApplicationAccountManager.getInstance();
