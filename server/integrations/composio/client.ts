import { Composio } from '@composio/core';

export class ComposioClient {
  private static instance: ComposioClient;
  private sdk: Composio | null = null;
  private lastApiKey: string | null = null;

  private constructor() {
    this.refreshClient();
  }

  public static getInstance(): ComposioClient {
    if (!ComposioClient.instance) {
      ComposioClient.instance = new ComposioClient();
    }
    return ComposioClient.instance;
  }

  public refreshClient(): boolean {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      if (this.lastApiKey !== apiKey || !this.sdk) {
        this.sdk = new Composio({ apiKey: apiKey.trim() });
        this.lastApiKey = apiKey;
      }
      return true;
    }
    this.sdk = null;
    this.lastApiKey = null;
    return false;
  }

  public isConfigured(): boolean {
    const key = process.env.COMPOSIO_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  public getSDK(): Composio {
    this.refreshClient();
    if (!this.sdk) {
      throw new Error('Composio SDK is not configured. Please set COMPOSIO_API_KEY.');
    }
    return this.sdk;
  }
}

export const composioClient = ComposioClient.getInstance();

