import { getSupabaseAdmin } from '../../src/utils/supabaseAdmin.ts';
import { kmsEnvelopeEncryptionService, type KmsEncryptedEnvelope } from './kms-envelope-encryption.service.ts';
import { digitalIdentityService } from '../identity/digital-identity.service.ts';

export interface SecretScope {
  orgId: string;
  agentId: string;
  secretId: string;
}

/** Production credential storage backed by Cloud KMS and ciphertext-only DB rows. */
export class CredentialVault {
  private static instance: CredentialVault;
  private constructor() {}

  public static getInstance(): CredentialVault {
    if (!CredentialVault.instance) CredentialVault.instance = new CredentialVault();
    return CredentialVault.instance;
  }

  private normalizeScope(scope: SecretScope) {
    const organizationId = scope.orgId?.trim();
    const agentId = scope.agentId?.trim().toLowerCase();
    const purpose = scope.secretId?.trim().toLowerCase();
    if (!organizationId || !agentId || !purpose || purpose.length > 100 || !/^[a-z0-9._-]+$/.test(purpose)) {
      throw new Error('A complete credential scope is required.');
    }
    return { organizationId, agentId, purpose: `credential:${purpose}` };
  }

  public async storeSecret(scope: SecretScope, plaintext: string): Promise<void> {
    if (typeof plaintext !== 'string' || plaintext.length === 0) throw new Error('Secret must not be empty.');
    const normalized = this.normalizeScope(scope);
    const envelope = await kmsEnvelopeEncryptionService.encryptString(plaintext, normalized);
    const { error } = await getSupabaseAdmin().from('agent_secret_envelopes').upsert({
      organization_id: normalized.organizationId,
      agent_id: normalized.agentId,
      purpose: normalized.purpose,
      kms_key_name: envelope.keyName,
      wrapped_dek: toBytea(envelope.wrappedDek),
      ciphertext: toBytea(envelope.ciphertext),
      nonce: toBytea(envelope.iv),
      auth_tag: toBytea(envelope.authTag),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,agent_id,purpose' });
    if (error) throw new Error('Credential could not be stored securely.');
    await digitalIdentityService.logIdentityActivity(normalized.organizationId, normalized.agentId, 'CREDENTIAL_ADDED_OR_ROTATED', `Stored or rotated encrypted credential ${normalized.purpose}.`);
  }

  public async retrieveSecret(scope: SecretScope): Promise<string | null> {
    const normalized = this.normalizeScope(scope);
    const { data, error } = await getSupabaseAdmin().from('agent_secret_envelopes').select('*')
      .eq('organization_id', normalized.organizationId).eq('agent_id', normalized.agentId).eq('purpose', normalized.purpose).maybeSingle();
    if (error) throw new Error('Credential lookup failed.');
    if (!data) return null;
    const envelope: KmsEncryptedEnvelope = {
      version: 1,
      algorithm: 'AES-256-GCM',
      keyName: data.kms_key_name,
      wrappedDek: fromBytea(data.wrapped_dek),
      ciphertext: fromBytea(data.ciphertext),
      iv: fromBytea(data.nonce),
      authTag: fromBytea(data.auth_tag),
    };
    const secret = await kmsEnvelopeEncryptionService.decryptString(envelope, normalized);
    await digitalIdentityService.logIdentityActivity(normalized.organizationId, normalized.agentId, 'CREDENTIAL_ACCESSED', `Accessed encrypted credential ${normalized.purpose}.`);
    return secret;
  }

  public async revokeSecret(scope: SecretScope): Promise<boolean> {
    const normalized = this.normalizeScope(scope);
    const { data, error } = await getSupabaseAdmin().from('agent_secret_envelopes').delete()
      .eq('organization_id', normalized.organizationId).eq('agent_id', normalized.agentId).eq('purpose', normalized.purpose)
      .select('id').maybeSingle();
    if (error) throw new Error('Credential could not be revoked.');
    if (data) await digitalIdentityService.logIdentityActivity(normalized.organizationId, normalized.agentId, 'CREDENTIAL_REVOKED', `Revoked encrypted credential ${normalized.purpose}.`);
    return Boolean(data);
  }

  public async hasSecret(scope: SecretScope): Promise<boolean> {
    const normalized = this.normalizeScope(scope);
    const { data, error } = await getSupabaseAdmin().from('agent_secret_envelopes').select('id')
      .eq('organization_id', normalized.organizationId).eq('agent_id', normalized.agentId).eq('purpose', normalized.purpose).maybeSingle();
    if (error) throw new Error('Credential lookup failed.');
    return Boolean(data);
  }

  public async listScopedSecrets(orgId: string, agentId: string): Promise<string[]> {
    const { data, error } = await getSupabaseAdmin().from('agent_secret_envelopes').select('purpose')
      .eq('organization_id', orgId.trim()).eq('agent_id', agentId.trim().toLowerCase()).like('purpose', 'credential:%');
    if (error) throw new Error('Credential index lookup failed.');
    return (data ?? []).map((row) => String(row.purpose).slice('credential:'.length));
  }

  /** Redacts likely credential forms before application-controlled log or output sinks. */
  public redactSecrets(input: string): string {
    if (!input || typeof input !== 'string') return input;
    return input
      .replace(/(?:bearer\s+|token=)[\w-]{20,}/gi, 'bearer [REDACTED_TOKEN]')
      .replace(/(?:ghp_|gho_|github_pat_)[\w]{30,}/g, '[REDACTED_GITHUB_TOKEN]')
      .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]')
      .replace(/(?:password|secret|passwd)['"]?\s*[:=]\s*['"]?[^\s"',;]{6,}['"]?/gi, 'password="[REDACTED]"');
  }
}

function toBytea(base64: string): string {
  return `\\x${Buffer.from(base64, 'base64').toString('hex')}`;
}

function fromBytea(value: string): string {
  if (typeof value !== 'string' || !value.startsWith('\\x')) throw new Error('Stored credential envelope is malformed.');
  return Buffer.from(value.slice(2), 'hex').toString('base64');
}

export const credentialVault = CredentialVault.getInstance();
