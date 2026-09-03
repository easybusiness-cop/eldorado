import { ISecretProvider, DevEnvSecretProvider, VaultCompatibleSecretProvider } from "./secret.provider";

export class SecretService {
  private static provider: ISecretProvider = process.env.NODE_ENV === "production"
    ? new VaultCompatibleSecretProvider()
    : new DevEnvSecretProvider();

  public static async getSecret(key: string): Promise<string | undefined> {
    return this.provider.getSecret(key);
  }

  public static async setSecret(key: string, value: string): Promise<void> {
    await this.provider.setSecret(key, value);
  }

  /**
   * Implements strict credential and secret redaction algorithms over all text strings and JSON records
   */
  public static redact(text: string): string {
    if (!text) return "";
    let redacted = text;

    // RegEx patterns for common credentials
    const patterns = [
      /ghp_[a-zA-Z0-9]{30,40}/gi, // Github Token
      /sk_live_[a-zA-Z0-9]{24}/gi, // Stripe Secret
      /xoxb-[0-9]{10,13}-[a-zA-Z0-9]+/gi, // Slack Token
      /AIzaSy[a-zA-Z0-9_-]{33}/g, // Google API Key
      /bearer\s+[a-zA-Z0-9\._\-]+/gi, // Authorization headers
      /password\s*=\s*[a-zA-Z0-9!@#$%^&*]+/gi, // DB passwords
      /cookie\s*:\s*[a-zA-Z0-9\._\-;=\s]+/gi, // Cookies
    ];

    for (const pattern of patterns) {
      redacted = redacted.replace(pattern, "[REDACTED_SECURITY_GATEWAY]");
    }

    return redacted;
  }
}
