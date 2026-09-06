import crypto from 'crypto';

export class SecretService {
  private key: Buffer;
  private storage: Map<string, string> = new Map();

  constructor() {
    const secret = process.env.SECRET_ENCRYPTION_KEY || 'rufflo-mit-level-secret-encryption-salt-2026';
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  encrypt(data: string): string {
    if (!data) return '';
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}_${encrypted}`;
    } catch {
      return Buffer.from(data).toString('hex');
    }
  }

  decrypt(cipherText: string): string {
    if (!cipherText) return '';
    try {
      if (cipherText.includes('_')) {
        const [ivHex, encrypted] = cipherText.split('_');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }
      return Buffer.from(cipherText, 'hex').toString('utf8');
    } catch {
      return cipherText;
    }
  }

  async getEncryptedData(branch: string, path: string): Promise<string> {
    const key = `${branch}:${path}`;
    return this.storage.get(key) || '';
  }

  async saveEncryptedData(branch: string, path: string, data: string): Promise<void> {
    const key = `${branch}:${path}`;
    this.storage.set(key, data);
  }
}

export const secretService = new SecretService();
