import { credentialVault } from '../security/credential-vault.ts';
import { eventBus } from '../events/eventBus.ts';

export interface AgentEmailIdentity {
  agentId: string;
  organizationId: string;
  emailAddress: string;
  provider: 'google_workspace' | 'gmail_oauth' | 'internal_relay';
  status: 'active' | 'pending_oauth' | 'suspended';
  workspaceDomain?: string;
  oauthScope?: string[];
  lastVerifiedAt?: string;
}

export interface VerificationExtractionResult {
  hasOtp: boolean;
  otpCode?: string;
  verificationLink?: string;
  confidence: number;
  extractedFrom: 'subject' | 'body';
}

export interface VerificationEmailMessage {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  receivedAt: string;
  extraction: VerificationExtractionResult;
}

export class EmailInfrastructureService {
  private static instance: EmailInfrastructureService;
  private agentMailboxes: Map<string, AgentEmailIdentity> = new Map();
  private mockIncomingMailbox: Map<string, VerificationEmailMessage[]> = new Map();

  private constructor() {}

  public static getInstance(): EmailInfrastructureService {
    if (!EmailInfrastructureService.instance) {
      EmailInfrastructureService.instance = new EmailInfrastructureService();
    }
    return EmailInfrastructureService.instance;
  }

  private getKey(orgId: string, agentId: string): string {
    return `${(orgId || 'org-alpha').toLowerCase().trim()}:${agentId.toLowerCase().trim()}`;
  }

  /**
   * Assigns an email identity to an agent
   */
  public allocateEmailIdentity(
    orgId: string,
    agentId: string,
    options?: {
      preferredDomain?: string;
      customEmail?: string;
      provider?: 'google_workspace' | 'gmail_oauth' | 'internal_relay';
    }
  ): AgentEmailIdentity {
    const key = this.getKey(orgId, agentId);
    const existing = this.agentMailboxes.get(key);
    if (existing) {
      return existing;
    }

    const domain = options?.preferredDomain || 'dundermifflin.internal';
    const emailAddress = options?.customEmail || `${agentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@${domain}`;
    const provider = options?.provider || 'internal_relay';

    const identity: AgentEmailIdentity = {
      agentId: agentId.toLowerCase().trim(),
      organizationId: orgId.toLowerCase().trim(),
      emailAddress,
      provider,
      status: 'active',
      workspaceDomain: domain,
      oauthScope: provider === 'gmail_oauth' ? ['https://www.googleapis.com/auth/gmail.readonly'] : undefined,
      lastVerifiedAt: new Date().toISOString(),
    };

    this.agentMailboxes.set(key, identity);
    return identity;
  }

  public getEmailIdentity(orgId: string, agentId: string): AgentEmailIdentity | null {
    return this.agentMailboxes.get(this.getKey(orgId, agentId)) || null;
  }

  /**
   * Stores OAuth credentials for a Gmail account securely in the CredentialVault
   */
  public async storeGmailOAuthTokens(
    orgId: string,
    agentId: string,
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: number;
    }
  ): Promise<void> {
    await credentialVault.storeSecret(
      { orgId, agentId, secretId: 'gmail_oauth_tokens' },
      JSON.stringify(tokens),
      { provider: 'gmail_oauth', updatedAt: new Date().toISOString() }
    );

    const emailIdentity = this.getEmailIdentity(orgId, agentId);
    if (emailIdentity) {
      emailIdentity.provider = 'gmail_oauth';
      emailIdentity.status = 'active';
      emailIdentity.lastVerifiedAt = new Date().toISOString();
    }
  }

  /**
   * Extracts OTP codes (4-8 digits) and verification links from email text
   */
  public extractVerificationOtpAndLinks(subject: string, body: string): VerificationExtractionResult {
    const combined = `${subject}\n${body}`;

    // 1. Link matching
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`]+(?:verify|confirm|verification|token|activate|code=)[^\s<>"{}|\\^`]+/i;
    const linkMatch = combined.match(urlPattern);

    // 2. OTP code matching (e.g. "code is 123456", "verification code: 789012", "OTP: 4567")
    const otpContextPattern = /(?:verification\s+code|confirmation\s+code|one-time\s+passcode|passcode|otp|pin|code\s+is|is:)[\s:]*([0-9]{4,8}|[A-Z0-9]{6,8})/i;
    const contextMatch = combined.match(otpContextPattern);

    let otpCode: string | undefined;
    let confidence = 0;

    if (contextMatch && contextMatch[1]) {
      otpCode = contextMatch[1].trim();
      confidence = 95;
    } else {
      // Standalone 6-digit number check
      const digitMatch = combined.match(/\b([0-9]{6})\b/);
      if (digitMatch && digitMatch[1]) {
        otpCode = digitMatch[1];
        confidence = 80;
      }
    }

    const verificationLink = linkMatch ? linkMatch[0] : undefined;
    if (verificationLink && !otpCode) {
      confidence = 90;
    }

    return {
      hasOtp: Boolean(otpCode || verificationLink),
      otpCode,
      verificationLink,
      confidence,
      extractedFrom: otpCode && subject.includes(otpCode) ? 'subject' : 'body',
    };
  }

  /**
   * Simulates/receives an incoming verification email for autonomous processing
   */
  public receiveIncomingEmail(
    orgId: string,
    agentId: string,
    message: {
      sender: string;
      subject: string;
      body: string;
    }
  ): VerificationEmailMessage {
    const key = this.getKey(orgId, agentId);
    const identity = this.getEmailIdentity(orgId, agentId);
    const extraction = this.extractVerificationOtpAndLinks(message.subject, message.body);

    const emailMsg: VerificationEmailMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: message.sender,
      recipient: identity?.emailAddress || `${agentId}@dundermifflin.internal`,
      subject: message.subject,
      body: message.body,
      receivedAt: new Date().toISOString(),
      extraction,
    };

    const inbox = this.mockIncomingMailbox.get(key) || [];
    inbox.unshift(emailMsg);
    if (inbox.length > 20) inbox.pop();
    this.mockIncomingMailbox.set(key, inbox);

    eventBus.emitEvent('AGENT_EMAIL_RECEIVED', {
      orgId,
      agentId,
      sender: message.sender,
      subject: message.subject,
      hasOtp: extraction.hasOtp,
      otpCode: extraction.otpCode,
    });

    return emailMsg;
  }

  /**
   * Retrieves messages received for an agent's email
   */
  public getAgentInbox(orgId: string, agentId: string): VerificationEmailMessage[] {
    const key = this.getKey(orgId, agentId);
    return this.mockIncomingMailbox.get(key) || [];
  }

  /**
   * Retrieves latest OTP code received for an agent
   */
  public getLatestOtpForAgent(orgId: string, agentId: string): string | null {
    const inbox = this.getAgentInbox(orgId, agentId);
    for (const msg of inbox) {
      if (msg.extraction.otpCode) {
        return msg.extraction.otpCode;
      }
    }
    return null;
  }
}

export const emailInfrastructureService = EmailInfrastructureService.getInstance();
