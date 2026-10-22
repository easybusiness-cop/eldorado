import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import {
  KmsConfigurationError,
  KmsEnvelopeEncryptionService,
  SecretEnvelopeError,
  type KmsEnvelopeClient,
  type SecretEncryptionScope,
} from '../server/security/kms-envelope-encryption.service.ts';

const keyRing = 'projects/rufflo-prod/locations/us/keyRings/agent-secrets';
const keyName = `${keyRing}/cryptoKeys/current`;
const scope: SecretEncryptionScope = {
  organizationId: 'org-a',
  agentId: 'agent-7',
  purpose: 'google-refresh-token',
};

class InMemoryKms implements KmsEnvelopeClient {
  private readonly wrappingKey = crypto.randomBytes(32);

  async encrypt(request: { name: string; plaintext: Buffer; additionalAuthenticatedData: Buffer }) {
    assert.equal(request.name.startsWith(keyRing), true);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.wrappingKey, iv);
    cipher.setAAD(request.additionalAuthenticatedData);
    const ciphertext = Buffer.concat([cipher.update(request.plaintext), cipher.final()]);
    return [{ ciphertext: Buffer.concat([iv, cipher.getAuthTag(), ciphertext]) }] as [{ ciphertext: Buffer }];
  }

  async decrypt(request: { name: string; ciphertext: Buffer; additionalAuthenticatedData: Buffer }) {
    assert.equal(request.name.startsWith(keyRing), true);
    const iv = request.ciphertext.subarray(0, 12);
    const tag = request.ciphertext.subarray(12, 28);
    const ciphertext = request.ciphertext.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.wrappingKey, iv);
    decipher.setAAD(request.additionalAuthenticatedData);
    decipher.setAuthTag(tag);
    return [{ plaintext: Buffer.concat([decipher.update(ciphertext), decipher.final()]) }] as [{ plaintext: Buffer }];
  }
}

test('KMS envelope round trips and binds ciphertext to organization, agent, and purpose', async () => {
  const service = new KmsEnvelopeEncryptionService({ keyName, kmsClient: new InMemoryKms() });
  const secret = 'refresh-token-value-that-must-stay-encrypted';
  const envelope = await service.encryptString(secret, scope);

  assert.equal(envelope.algorithm, 'AES-256-GCM');
  assert.equal(JSON.stringify(envelope).includes(secret), false);
  assert.equal(await service.decryptString(envelope, scope), secret);

  await assert.rejects(
    service.decryptString(envelope, { ...scope, organizationId: 'org-b' }),
    SecretEnvelopeError,
  );
  await assert.rejects(
    service.decryptString(envelope, { ...scope, agentId: 'agent-8' }),
    SecretEnvelopeError,
  );
  await assert.rejects(
    service.decryptString(envelope, { ...scope, purpose: 'gmail-send-token' }),
    SecretEnvelopeError,
  );
});

test('KMS envelope detects tampering and disallows unrelated key rings', async () => {
  const service = new KmsEnvelopeEncryptionService({ keyName, kmsClient: new InMemoryKms() });
  const envelope = await service.encryptString('opaque-value', scope);

  await assert.rejects(
    service.decryptString({ ...envelope, ciphertext: Buffer.from('tampered').toString('base64') }, scope),
    SecretEnvelopeError,
  );
  await assert.rejects(
    service.decryptString({
      ...envelope,
      keyName: 'projects/attacker/locations/us/keyRings/foreign/cryptoKeys/key',
    }, scope),
    SecretEnvelopeError,
  );
});

test('missing production KMS configuration fails closed without a local-key fallback', async () => {
  const service = new KmsEnvelopeEncryptionService({ keyName: '' });
  assert.equal(service.isConfigured(), false);
  await assert.rejects(service.encryptString('secret', scope), KmsConfigurationError);
});

test('KMS key rotation remains decryptable within the configured key ring', async () => {
  const kmsClient = new InMemoryKms();
  const oldKeyName = `${keyRing}/cryptoKeys/previous`;
  const oldService = new KmsEnvelopeEncryptionService({ keyName: oldKeyName, kmsClient });
  const envelope = await oldService.encryptString('rotated-key-secret', scope);
  const currentService = new KmsEnvelopeEncryptionService({ keyName, kmsClient });

  assert.equal(await currentService.decryptString(envelope, scope), 'rotated-key-secret');
});
