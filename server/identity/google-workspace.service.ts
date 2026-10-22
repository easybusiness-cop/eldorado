import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '../../src/utils/supabaseAdmin.ts';
import { kmsEnvelopeEncryptionService, type KmsEncryptedEnvelope } from '../security/kms-envelope-encryption.service.ts';
import { digitalIdentityService } from './digital-identity.service.ts';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const SCOPE_BY_CAPABILITY: Record<string, string> = {
  'gmail:read': 'https://www.googleapis.com/auth/gmail.readonly',
  'gmail:send': 'https://www.googleapis.com/auth/gmail.send',
};
const SECRET_PURPOSE = 'google-workspace-oauth-tokens';

interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  grantedScopes: string[];
}

export interface MailboxMessageSummary {
  id: string;
  sender: string;
  subject: string;
  receivedAt: string;
}

export class GoogleWorkspaceService {
  public isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() &&
      process.env.GOOGLE_WORKSPACE_DOMAIN?.trim() &&
      kmsEnvelopeEncryptionService.isConfigured(),
    );
  }

  public async beginAuthorization(input: {
    organizationId: string;
    agentId: string;
    userId: string;
    approvedCapabilities: string[];
  }): Promise<string> {
    const clientId = this.requiredEnv('GOOGLE_OAUTH_CLIENT_ID');
    const redirectUri = this.requiredEnv('GOOGLE_OAUTH_REDIRECT_URI');
    const capabilities = Object.keys(SCOPE_BY_CAPABILITY).filter((capability) => input.approvedCapabilities.includes(capability));
    if (capabilities.length === 0) throw new Error('Approve gmail:read or gmail:send before connecting a mailbox.');
    const scopes = ['openid', 'email', ...capabilities.map((capability) => SCOPE_BY_CAPABILITY[capability])];
    const state = randomBytes(32).toString('base64url');
    const stateHash = hashState(state);
    const { error } = await getSupabaseAdmin().from('agent_google_oauth_states').insert({
      state_hash: hexBytea(stateHash),
      organization_id: input.organizationId,
      agent_id: input.agentId.trim().toLowerCase(),
      requested_scopes: scopes,
      requested_by: input.userId,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    if (error) throw new Error('Google authorization could not be started.');

    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('include_granted_scopes', 'true');
    url.searchParams.set('state', state);
    url.searchParams.set('hd', this.requiredEnv('GOOGLE_WORKSPACE_DOMAIN'));
    return url.toString();
  }

  public async completeAuthorization(code: string, state: string): Promise<{ organizationId: string; agentId: string; emailAddress: string }> {
    if (!code || code.length > 4096 || !state || state.length > 256) throw new Error('Google authorization response is invalid.');
    const stateHash = hexBytea(hashState(state));
    const db = getSupabaseAdmin();
    const { data: consumed, error: consumeError } = await db.from('agent_google_oauth_states')
      .update({ consumed_at: new Date().toISOString() })
      .eq('state_hash', stateHash).is('consumed_at', null).gt('expires_at', new Date().toISOString())
      .select('organization_id,agent_id,requested_scopes,requested_by').maybeSingle();
    if (consumeError || !consumed) throw new Error('Google authorization state is expired or already used.');

    const tokens = await this.exchangeCode(code);
    const profile = await this.googleRequest('https://openidconnect.googleapis.com/v1/userinfo', tokens.accessToken);
    const emailAddress = String(profile.email || '').trim().toLowerCase();
    if (profile.email_verified !== true || !emailAddress || !this.isAllowedWorkspaceMailbox(emailAddress)) {
      throw new Error('The connected Google account is outside the configured Workspace domain.');
    }
    if (!tokens.refreshToken) throw new Error('Google did not grant a refresh token. Revoke the prior grant and reconnect with consent.');
    const requestedGmailScopes = consumed.requested_scopes.filter((value: string) => Object.values(SCOPE_BY_CAPABILITY).includes(value));
    if (requestedGmailScopes.some((scope: string) => !tokens.grantedScopes.includes(scope))) {
      throw new Error('Google did not grant every approved Gmail permission. Retry after completing consent.');
    }

    const scope = {
      organizationId: consumed.organization_id,
      agentId: consumed.agent_id,
      purpose: SECRET_PURPOSE,
    };
    const encrypted = await kmsEnvelopeEncryptionService.encryptString(JSON.stringify(tokens), scope);
    const { data: secretRow, error: secretError } = await db.from('agent_secret_envelopes').upsert({
      organization_id: scope.organizationId,
      agent_id: scope.agentId,
      purpose: SECRET_PURPOSE,
      kms_key_name: encrypted.keyName,
      wrapped_dek: bytea(encrypted.wrappedDek),
      ciphertext: bytea(encrypted.ciphertext),
      nonce: bytea(encrypted.iv),
      auth_tag: bytea(encrypted.authTag),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,agent_id,purpose' }).select('id').single();
    if (secretError || !secretRow) throw new Error('Google credentials could not be stored securely.');

    const grantedGmailScopes = tokens.grantedScopes.filter((scopeUrl) => Object.values(SCOPE_BY_CAPABILITY).includes(scopeUrl));
    const { error: identityError } = await db.from('agent_digital_identities').update({
      email_address: emailAddress,
      email_provider: 'google_workspace',
      status: 'active',
      updated_at: new Date().toISOString(),
    }).eq('organization_id', scope.organizationId).eq('agent_id', scope.agentId);
    if (identityError) throw new Error('Google mailbox identity could not be assigned.');

    const { error: accountError } = await db.from('agent_connected_accounts').upsert({
      account_id: `google-${randomUUID()}`,
      organization_id: scope.organizationId,
      agent_id: scope.agentId,
      platform: 'google_workspace',
      account_handle: emailAddress,
      email_used: emailAddress,
      status: 'active',
      authorization_status: 'approved',
      requested_by: consumed.requested_by,
      approved_by: consumed.requested_by,
      scopes: grantedGmailScopes,
      credential_ref: secretRow.id,
    }, { onConflict: 'organization_id,agent_id,platform,account_handle' });
    if (accountError) throw new Error('Google mailbox account could not be registered.');

    await digitalIdentityService.logIdentityActivity(scope.organizationId, scope.agentId, 'GOOGLE_WORKSPACE_CONNECTED', 'Connected an authorized Google Workspace mailbox.');
    return { organizationId: scope.organizationId, agentId: scope.agentId, emailAddress };
  }

  public async listInbox(organizationId: string, agentId: string, limit = 20): Promise<MailboxMessageSummary[]> {
    await this.requireAgentPermission(organizationId, agentId, 'gmail:read');
    const accessToken = await this.getAccessToken(organizationId, agentId);
    const list = await this.googleRequest(`${GMAIL_API}/messages?labelIds=INBOX&maxResults=${Math.max(1, Math.min(50, limit))}`, accessToken);
    const messages = Array.isArray(list.messages) ? list.messages : [];
    return Promise.all(messages.map(async (message: { id: string }) => {
      const detail = await this.googleRequest(`${GMAIL_API}/messages/${encodeURIComponent(message.id)}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, accessToken);
      const headers: Array<{ name: string; value: string }> = detail.payload?.headers || [];
      const header = (name: string) => headers.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value || '';
      return {
        id: String(detail.id || message.id),
        sender: redactCodes(header('From')).slice(0, 320),
        subject: redactCodes(header('Subject')).slice(0, 500),
        receivedAt: header('Date').slice(0, 120),
      };
    }));
  }

  public async sendEmail(input: { organizationId: string; agentId: string; to: string; subject: string; text: string }): Promise<void> {
    await this.requireAgentPermission(input.organizationId, input.agentId, 'gmail:send');
    const accessToken = await this.getAccessToken(input.organizationId, input.agentId);
    const recipient = input.to.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) || recipient.length > 320) throw new Error('A valid recipient address is required.');
    const subject = input.subject.trim().slice(0, 500);
    const text = input.text.slice(0, 20_000);
    if (!subject || !text) throw new Error('Email subject and body are required.');
    const raw = [`To: ${recipient}`, `Subject: ${subject.replace(/[\r\n]/g, ' ')}`, 'Content-Type: text/plain; charset="UTF-8"', '', text].join('\r\n');
    await this.googleRequest(`${GMAIL_API}/messages/send`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ raw: Buffer.from(raw).toString('base64url') }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async requireAgentPermission(organizationId: string, agentId: string, permission: string): Promise<void> {
    if (!(await digitalIdentityService.hasPermission(organizationId, agentId, permission))) {
      throw new Error(`The agent has not been granted ${permission}.`);
    }
  }

  private async getAccessToken(organizationId: string, agentId: string): Promise<string> {
    const db = getSupabaseAdmin();
    const { data: row, error } = await db.from('agent_secret_envelopes').select('*')
      .eq('organization_id', organizationId).eq('agent_id', agentId.trim().toLowerCase()).eq('purpose', SECRET_PURPOSE).maybeSingle();
    if (error || !row) throw new Error('No authorized Google Workspace mailbox is connected.');
    const envelope: KmsEncryptedEnvelope = {
      version: 1,
      algorithm: 'AES-256-GCM',
      keyName: row.kms_key_name,
      wrappedDek: fromBytea(row.wrapped_dek),
      ciphertext: fromBytea(row.ciphertext),
      iv: fromBytea(row.nonce),
      authTag: fromBytea(row.auth_tag),
    };
    let tokens: GoogleTokens;
    try {
      tokens = JSON.parse(await kmsEnvelopeEncryptionService.decryptString(envelope, {
        organizationId,
        agentId: agentId.trim().toLowerCase(),
        purpose: SECRET_PURPOSE,
      }));
    } catch {
      throw new Error('Google credentials could not be decrypted.');
    }
    if (tokens.expiresAt > Date.now() + 60_000) return tokens.accessToken;
    const refreshed = await this.refreshTokens(tokens.refreshToken);
    const nextTokens = { ...tokens, accessToken: refreshed.access_token, expiresAt: Date.now() + Number(refreshed.expires_in) * 1000 };
    const encrypted = await kmsEnvelopeEncryptionService.encryptString(JSON.stringify(nextTokens), {
      organizationId,
      agentId: agentId.trim().toLowerCase(),
      purpose: SECRET_PURPOSE,
    });
    const { error: updateError } = await db.from('agent_secret_envelopes').update({
      kms_key_name: encrypted.keyName,
      wrapped_dek: bytea(encrypted.wrappedDek),
      ciphertext: bytea(encrypted.ciphertext),
      nonce: bytea(encrypted.iv),
      auth_tag: bytea(encrypted.authTag),
      updated_at: new Date().toISOString(),
    }).eq('id', row.id);
    if (updateError) throw new Error('Refreshed Google credentials could not be stored securely.');
    return nextTokens.accessToken;
  }

  private async exchangeCode(code: string): Promise<GoogleTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.requiredEnv('GOOGLE_OAUTH_CLIENT_ID'),
        client_secret: this.requiredEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
        redirect_uri: this.requiredEnv('GOOGLE_OAUTH_REDIRECT_URI'),
        grant_type: 'authorization_code',
      }),
    });
    if (!response.ok) throw new Error('Google authorization code exchange failed.');
    const data = await response.json() as Record<string, unknown>;
    if (typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string' || typeof data.expires_in !== 'number' || typeof data.scope !== 'string') {
      throw new Error('Google did not return a durable mailbox grant.');
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      grantedScopes: data.scope.split(/\s+/).filter(Boolean),
    };
  }

  private async refreshTokens(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.requiredEnv('GOOGLE_OAUTH_CLIENT_ID'),
        client_secret: this.requiredEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!response.ok) throw new Error('Google credential refresh failed.');
    const data = await response.json() as Record<string, unknown>;
    if (typeof data.access_token !== 'string' || typeof data.expires_in !== 'number') throw new Error('Google credential refresh response is invalid.');
    return { access_token: data.access_token, expires_in: data.expires_in };
  }

  private async googleRequest(url: string, accessToken: string, init: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error(`Google Workspace request failed (${response.status}).`);
    return response.json();
  }

  private isAllowedWorkspaceMailbox(emailAddress: string): boolean {
    const expectedDomain = this.requiredEnv('GOOGLE_WORKSPACE_DOMAIN').toLowerCase().replace(/^@/, '');
    return emailAddress.split('@').at(-1) === expectedDomain;
  }

  private requiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is not configured.`);
    return value;
  }
}

function hashState(state: string): string {
  return createHash('sha256').update(state, 'utf8').digest('hex');
}

function bytea(base64OrHex: string): string {
  return `\\x${Buffer.from(base64OrHex, 'base64').toString('hex')}`;
}

function hexBytea(hex: string): string {
  return `\\x${Buffer.from(hex, 'hex').toString('hex')}`;
}

function fromBytea(value: string): string {
  if (typeof value !== 'string' || !value.startsWith('\\x')) throw new Error('Stored credential envelope is malformed.');
  return Buffer.from(value.slice(2), 'hex').toString('base64');
}

function redactCodes(value: string): string {
  return value.replace(/\b(?:verification\s+code|confirmation\s+code|one[- ]time\s+passcode|passcode|otp|pin)\b\s*[:#-]?\s*[A-Z0-9-]{4,12}\b/gi, '[redacted code]')
    .replace(/\b\d{6,8}\b/g, '[redacted code]');
}

export const googleWorkspaceService = new GoogleWorkspaceService();
