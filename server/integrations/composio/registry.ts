import { composioAuth } from './auth.ts';
import { composioToolGateway } from './tools.ts';
import { composioClient } from './client.ts';

export class ComposioRegistry {
  public client = composioClient;
  public auth = composioAuth;
  public tools = composioToolGateway;

  public async sync() {
    await this.auth.syncConnectionsFromComposio();
  }

  public getStatusSummary() {
    const connections = this.auth.getAllConnections();
    const connectedCount = connections.filter(c => c.connected).length;
    return {
      totalProviders: connections.length,
      connectedProviders: connectedCount,
      connections,
      isComposioConfigured: this.client.isConfigured(),
    };
  }
}

export const composioRegistry = new ComposioRegistry();
