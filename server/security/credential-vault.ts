import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface SecretScope {
  orgId: string;
  agentId: string;
  secretId: string;
}

export interface StoredSecretEnvelope {
  scopeKey: string;
  iv: string; // hex
  authTag: string; // hex
  ciphertext: string; // hex
  algorithm: 'aes-256-gcm';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export class CredentialVault {
  private static instance: CredentialVault;
  private vaultDir: string;
  private vaultFile: string;
  private keyFile: string;
  private masterKey: Buffer;
  private memoryCache: Map<string, StoredSecretEnvelope> = new Map();

  private constructor() {
    this.vaultDir = path.resolve(process.cwd(), '.rufflo-vault');
    this.vaultFile = path.join(this.vaultDir, 'vault_records.enc.json');
    this.keyFile = path.join(this.vaultDir, 'master.key');

    if (!fs.existsSync(this.vaultDir)) {
      fs.mkdirSync(this.vaultDir, { recursive: true });
    }

    this.masterKey = this.initMasterKey();
    this.loadVault();
  }

  public static getInstance(): CredentialVault {
    if (!CredentialVault.instance) {
      CredentialVault.instance = new CredentialVault();
    }
    return CredentialVault.instance;
  }

  private initMasterKey(): Buffer {
    const envKey = process.env.RUFFLO_VAULT_KEY;
    if (envKey && envKey.length >= 32) {
      return crypto.createHash('sha256').update(envKey).digest();
    }

    if (fs.existsSync(this.keyFile)) {
      try {
        const fileContent = fs.readFileSync(this.keyFile, 'utf8').trim();
        if (fileContent.length === 64) {
          return Buffer.from(fileContent, 'hex');
        }
      } catch (err) {
        console.warn('[CredentialVault] Failed reading existing key file, generating new key.');
      }
    }

    // Generate cryptographically secure 256-bit key
    const newKey = crypto.randomBytes(32);
    try {
      fs.writeFileSync(this.keyFile, newKey.toString('hex'), { mode: 0o600 });
    } catch {}
    return newKey;
  }

  private loadVault() {
    if (!fs.existsSync(this.vaultFile)) {
      return;
    }
    try {
      const data = fs.readFileSync(this.vaultFile, 'utf8');
      const parsed: StoredSecretEnvelope[] = JSON.parse(data);
      for (const item of parsed) {
        this.memoryCache.set(item.scopeKey, item);
      }
    } catch (err: any) {
      console.warn(`[CredentialVault] Error loading vault records: ${err.message}`);
    }
  }

  private persistVault() {
    try {
      const records = Array.from(this.memoryCache.values());
      fs.writeFileSync(this.vaultFile, JSON.stringify(records, null, 2), { mode: 0o600 });
    } catch (err: any) {
      console.error(`[CredentialVault] Failed to persist vault records: ${err.message}`);
    }
  }

  private getScopeKey(scope: SecretScope): string {
    const org = (scope.orgId || 'org-alpha').toLowerCase().trim();
    const agent = (scope.agentId || 'system').toLowerCase().trim();
    const secretId = scope.secretId.toLowerCase().trim();
    return `${org}:${agent}:${secretId}`;
  }

  /**
   * Encrypts and stores a secret under scoped tenant and agent authorization
   */
  public async storeSecret(
    scope: SecretScope,
    plaintext: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const scopeKey = this.getScopeKey(scope);
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const envelope: StoredSecretEnvelope = {
      scopeKey,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      ciphertext: encrypted.toString('hex'),
      algorithm: 'aes-256-gcm',
      createdAt: this.memoryCache.get(scopeKey)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
    };

    this.memoryCache.set(scopeKey, envelope);
    this.persistVault();
  }

  /**
   * Retrieves and decrypts a secret for an authorized agent in an organization
   */
  public async retrieveSecret(scope: SecretScope): Promise<string | null> {
    const scopeKey = this.getScopeKey(scope);
    const envelope = this.memoryCache.get(scopeKey);
    if (!envelope) {
      return null;
    }

    try {
      const iv = Buffer.from(envelope.iv, 'hex');
      const authTag = Buffer.from(envelope.authTag, 'hex');
      const ciphertext = Buffer.from(envelope.ciphertext, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (err: any) {
      console.error(`[CredentialVault] Integrity authentication failure for ${scopeKey}: ${err.message}`);
      return null;
    }
  }

  /**
   * Revokes and securely wipes a stored secret
   */
  public async revokeSecret(scope: SecretScope): Promise<boolean> {
    const scopeKey = this.getScopeKey(scope);
    const existed = this.memoryCache.delete(scopeKey);
    if (existed) {
      this.persistVault();
    }
    return existed;
  }

  /**
   * Checks whether a secret exists without decrypting it
   */
  public hasSecret(scope: SecretScope): boolean {
    return this.memoryCache.has(this.getScopeKey(scope));
  }

  /**
   * Returns list of secret IDs available for an agent (without exposing values)
   */
  public listScopedSecrets(orgId: string, agentId: string): string[] {
    const prefix = `${orgId.toLowerCase().trim()}:${agentId.toLowerCase().trim()}:`;
    const result: string[] = [];
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        result.push(key.substring(prefix.length));
      }
    }
    return result;
  }

  /**
   * Redacts potential secrets, API keys, and tokens from logs or agent outputs
   */
  public redactSecrets(input: string): string {
    if (!input || typeof input !== 'string') return input;
    return input
      .replace(/(?:bearer\s+|token=)[\w-]{20,}/gi, 'bearer [REDACTED_TOKEN]')
      .replace(/(?:ghp_|gho_|github_pat_)[\w]{30,}/g, '[REDACTED_GITHUB_TOKEN]')
      .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]')
      .replace(/(?:password|secret|passwd)['"]?\s*[:=]\s*['"]?[^\s"',;]{6,}['"]?/gi, 'password="[REDACTED]"');
  }

  /**
   * Rotates master key to re-encrypt all stored envelopes
   */
  public async rotateMasterKey(newKeyPlain: string): Promise<void> {
    const newMasterKey = crypto.createHash('sha256').update(newKeyPlain).digest();
    const decryptedMap = new Map<string, string>();

    // 1. Decrypt all with old key
    for (const [key, envelope] of this.memoryCache.entries()) {
      const iv = Buffer.from(envelope.iv, 'hex');
      const authTag = Buffer.from(envelope.authTag, 'hex');
      const ciphertext = Buffer.from(envelope.ciphertext, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
      decipher.setAuthTag(authTag);
      const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      decryptedMap.set(key, dec.toString('utf8'));
    }

    // 2. Switch key
    this.masterKey = newMasterKey;
    fs.writeFileSync(this.keyFile, this.masterKey.toString('hex'), { mode: 0o600 });

    // 3. Re-encrypt all with new key
    for (const [key, plaintext] of decryptedMap.entries()) {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
      const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();

      const envelope: StoredSecretEnvelope = {
        scopeKey: key,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        ciphertext: enc.toString('hex'),
        algorithm: 'aes-256-gcm',
        createdAt: this.memoryCache.get(key)?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.memoryCache.set(key, envelope);
    }
    this.persistVault();
  }
}

export const credentialVault = CredentialVault.getInstance();
