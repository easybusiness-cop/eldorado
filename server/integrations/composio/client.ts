import { Composio } from '@composio/core';

export class ComposioClient {
  private static instance: ComposioClient;
  private sdk: Composio | null = null;

  private constructor() {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (apiKey) {
      this.sdk = new Composio({ apiKey });
    }
  }

  public static getInstance(): ComposioClient {
    if (!ComposioClient.instance) {
      ComposioClient.instance = new ComposioClient();
    }
    return ComposioClient.instance;
  }

  public isConfigured(): boolean {
    return Boolean(process.env.COMPOSIO_API_KEY);
  }

  public getSDK(): Composio {
    if (!this.sdk) {
      throw new Error('Composio SDK is not configured. Please set COMPOSIO_API_KEY.');
    }
    return this.sdk;
  }
}

export const composioClient = ComposioClient.getInstance();
