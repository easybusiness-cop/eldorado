export interface ISecretProvider {
  getSecret(key: string): Promise<string | undefined>;
  setSecret(key: string, value: string): Promise<void>;
  listKeys(): Promise<string[]>;
}

export class DevEnvSecretProvider implements ISecretProvider {
  public async getSecret(key: string): Promise<string | undefined> {
    return process.env[key];
  }
  public async setSecret(key: string, value: string): Promise<void> {
    process.env[key] = value;
  }
  public async listKeys(): Promise<string[]> {
    return Object.keys(process.env);
  }
}

export class VaultCompatibleSecretProvider implements ISecretProvider {
  private localVault: Map<string, string> = new Map([
    ["GITHUB_ACCESS_TOKEN", "ghp_simulated_secure_oauth_token_991823"],
    ["POSTGRESQL_CONNECTION_STRING", "postgresql://db_user:vault_pwd@cloud-sql-postgres.internal:5432/munderdifflin"],
    ["STRIPE_SECRET_KEY", "sk_live_vault_secured_991203"],
    ["SLACK_BOT_TOKEN", "xoxb-vault-token-3819283-99"]
  ]);

  public async getSecret(key: string): Promise<string | undefined> {
    // Standard secure vault read delay
    await new Promise((resolve) => setTimeout(resolve, 30));
    return this.localVault.get(key) || process.env[key];
  }

  public async setSecret(key: string, value: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    this.localVault.set(key, value);
  }

  public async listKeys(): Promise<string[]> {
    return Array.from(this.localVault.keys());
  }
}
