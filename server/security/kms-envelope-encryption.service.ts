import { KeyManagementServiceClient } from '@google-cloud/kms';
import crypto from 'node:crypto';

/** The tenant, agent, and use of a secret are cryptographically bound to its envelope. */
export interface SecretEncryptionScope {
  organizationId: string;
  agentId: string;
  purpose: string;
}

/** Persist this envelope as an opaque value; it contains no plaintext key material. */
export interface KmsEncryptedEnvelope {
  version: 1;
  algorithm: 'AES-256-GCM';
  keyName: string;
  wrappedDek: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

export interface KmsEnvelopeClient {
  encrypt(request: {
    name: string;
    plaintext: Buffer;
    additionalAuthenticatedData: Buffer;
  }): Promise<[{ ciphertext?: Buffer | string | null }]>;
  decrypt(request: {
    name: string;
    ciphertext: Buffer;
    additionalAuthenticatedData: Buffer;
  }): Promise<[{ plaintext?: Buffer | string | null }]>;
}

export interface KmsEnvelopeEncryptionOptions {
  /** Defaults to RUFFLO_KMS_KEY_NAME. Must be a Cloud KMS CryptoKey resource name. */
  keyName?: string;
  /** Injection point for tests and controlled service composition. Production uses ADC. */
  kmsClient?: KmsEnvelopeClient;
}

const KEY_NAME_PATTERN = /^projects\/[^/]+\/locations\/[^/]+\/keyRings\/[^/]+\/cryptoKeys\/[^/]+$/;
const MAX_PLAINTEXT_BYTES = 100 * 1024 * 1024;
const MAX_WRAPPED_DEK_BYTES = 64 * 1024;
const FORMAT_DOMAIN = 'rufflo-agent-secret-envelope-v1';

export class KmsConfigurationError extends Error {
  constructor(message = 'Cloud KMS is not configured; secret encryption is unavailable.') {
    super(message);
    this.name = 'KmsConfigurationError';
  }
}

export class SecretEnvelopeError extends Error {
  constructor(message = 'Secret envelope could not be processed.') {
    super(message);
    this.name = 'SecretEnvelopeError';
  }
}

/**
 * Encrypts data with a fresh AES-256-GCM data key, then wraps that key with Cloud KMS.
 * The default Cloud KMS client uses Google Application Default Credentials, so production
 * should provide workload identity rather than a downloaded service-account key.
 *
 * This class deliberately does not provide a local-key or plaintext fallback. If the KMS
 * key is missing or KMS is unavailable, callers receive an error and must fail closed.
 */
export class KmsEnvelopeEncryptionService {
  private readonly keyName?: string;
  private readonly kmsClientOverride?: KmsEnvelopeClient;
  private client?: KmsEnvelopeClient;

  constructor(options: KmsEnvelopeEncryptionOptions = {}) {
    this.keyName = options.keyName ?? process.env.RUFFLO_KMS_KEY_NAME;
    this.kmsClientOverride = options.kmsClient;
  }

  public isConfigured(): boolean {
    return Boolean(this.keyName?.trim() && KEY_NAME_PATTERN.test(this.keyName.trim()));
  }

  public async encrypt(plaintext: string | Buffer, scope: SecretEncryptionScope): Promise<KmsEncryptedEnvelope> {
    const keyName = this.requireKeyName();
    const cleartext = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf8');
    if (cleartext.length > MAX_PLAINTEXT_BYTES) {
      throw new SecretEnvelopeError('Secret payload exceeds the supported size.');
    }

    const normalizedScope = normalizeScope(scope);
    const aad = makeAad(normalizedScope, keyName);
    const dek = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    try {
      const [kmsResponse] = await this.getClient().encrypt({
        name: keyName,
        plaintext: dek,
        additionalAuthenticatedData: aad,
      });
      const wrappedDek = toBuffer(kmsResponse.ciphertext);
      if (!wrappedDek.length || wrappedDek.length > MAX_WRAPPED_DEK_BYTES) {
        throw new Error('Invalid KMS response');
      }

      const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
      cipher.setAAD(aad);
      const ciphertext = Buffer.concat([cipher.update(cleartext), cipher.final()]);
      return {
        version: 1,
        algorithm: 'AES-256-GCM',
        keyName,
        wrappedDek: wrappedDek.toString('base64'),
        iv: iv.toString('base64'),
        authTag: cipher.getAuthTag().toString('base64'),
        ciphertext: ciphertext.toString('base64'),
      };
    } catch {
      throw new SecretEnvelopeError('Cloud KMS envelope encryption failed.');
    } finally {
      dek.fill(0);
    }
  }

  public async encryptString(plaintext: string, scope: SecretEncryptionScope): Promise<KmsEncryptedEnvelope> {
    return this.encrypt(plaintext, scope);
  }

  public async decrypt(envelope: KmsEncryptedEnvelope, scope: SecretEncryptionScope): Promise<Buffer> {
    const configuredKeyName = this.requireKeyName();
    const validated = validateEnvelope(envelope, configuredKeyName);
    const normalizedScope = normalizeScope(scope);
    const aad = makeAad(normalizedScope, validated.keyName);
    const wrappedDek = decodeBase64(validated.wrappedDek, MAX_WRAPPED_DEK_BYTES);
    const iv = decodeBase64(validated.iv, 12);
    const authTag = decodeBase64(validated.authTag, 16);
    const ciphertext = decodeBase64(validated.ciphertext, MAX_PLAINTEXT_BYTES);

    let dek: Buffer | undefined;
    try {
      const [kmsResponse] = await this.getClient().decrypt({
        name: validated.keyName,
        ciphertext: wrappedDek,
        additionalAuthenticatedData: aad,
      });
      dek = toBuffer(kmsResponse.plaintext);
      if (dek.length !== 32) throw new Error('Invalid KMS response');

      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
      decipher.setAAD(aad);
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
      throw new SecretEnvelopeError('Secret envelope could not be authenticated for the supplied scope.');
    } finally {
      dek?.fill(0);
    }
  }

  public async decryptString(envelope: KmsEncryptedEnvelope, scope: SecretEncryptionScope): Promise<string> {
    return (await this.decrypt(envelope, scope)).toString('utf8');
  }

  private requireKeyName(): string {
    const keyName = this.keyName?.trim();
    if (!keyName || !KEY_NAME_PATTERN.test(keyName)) throw new KmsConfigurationError();
    return keyName;
  }

  private getClient(): KmsEnvelopeClient {
    if (this.kmsClientOverride) return this.kmsClientOverride;
    if (!this.client) {
      // KeyManagementServiceClient obtains credentials using ADC (including workload identity).
      this.client = new KeyManagementServiceClient() as unknown as KmsEnvelopeClient;
    }
    return this.client;
  }
}

export const kmsEnvelopeEncryptionService = new KmsEnvelopeEncryptionService();

function normalizeScope(scope: SecretEncryptionScope): SecretEncryptionScope {
  if (!scope || typeof scope !== 'object') throw new SecretEnvelopeError('A complete secret scope is required.');
  const values = [scope.organizationId, scope.agentId, scope.purpose].map((value) =>
    typeof value === 'string' ? value.normalize('NFC').trim() : '',
  );
  if (values.some((value) => value.length === 0 || value.length > 512 || value.includes('\0'))) {
    throw new SecretEnvelopeError('A complete secret scope is required.');
  }
  return { organizationId: values[0], agentId: values[1], purpose: values[2] };
}

function makeAad(scope: SecretEncryptionScope, keyName: string): Buffer {
  return Buffer.from(JSON.stringify([
    FORMAT_DOMAIN,
    scope.organizationId,
    scope.agentId,
    scope.purpose,
    keyName,
  ]), 'utf8');
}

function validateEnvelope(value: KmsEncryptedEnvelope, configuredKeyName: string): KmsEncryptedEnvelope {
  if (!value || typeof value !== 'object' || value.version !== 1 || value.algorithm !== 'AES-256-GCM') {
    throw new SecretEnvelopeError('Secret envelope has an unsupported format.');
  }
  if (typeof value.keyName !== 'string' || !KEY_NAME_PATTERN.test(value.keyName)) {
    throw new SecretEnvelopeError('Secret envelope has an invalid key reference.');
  }

  // Permit key rotation within the configured CryptoKey's key ring while preventing an
  // envelope from steering the service to an unrelated KMS resource.
  const configuredRing = configuredKeyName.slice(0, configuredKeyName.lastIndexOf('/'));
  const envelopeRing = value.keyName.slice(0, value.keyName.lastIndexOf('/'));
  if (configuredRing !== envelopeRing) {
    throw new SecretEnvelopeError('Secret envelope references an unauthorized KMS key ring.');
  }

  for (const field of ['wrappedDek', 'iv', 'authTag', 'ciphertext'] as const) {
    if (typeof value[field] !== 'string') throw new SecretEnvelopeError('Secret envelope is malformed.');
  }
  return value;
}

function decodeBase64(value: string, maxBytes: number): Buffer {
  if (!value || value.length > Math.ceil(maxBytes * 4 / 3) + 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new SecretEnvelopeError('Secret envelope is malformed.');
  }
  const decoded = Buffer.from(value, 'base64');
  if (decoded.length > maxBytes || decoded.toString('base64') !== value) {
    throw new SecretEnvelopeError('Secret envelope is malformed.');
  }
  return decoded;
}

function toBuffer(value: Buffer | string | null | undefined): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === 'string') return Buffer.from(value, 'base64');
  return Buffer.alloc(0);
}
