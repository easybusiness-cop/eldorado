import { toolGateway, ToolGateway } from '../../tools/gateway.ts';

export class InfrastructureEngineer {
  private toolGateway: ToolGateway;

  constructor() {
    this.toolGateway = toolGateway;
  }

  async deployToStaging() {
    return { success: true, environment: 'staging', url: 'https://staging.rufflo.com' };
  }

  async callPublicAPI(endpoint: string, params: any) {
    return await this.toolGateway.callPublicAPI(endpoint, params);
  }
}

export const infrastructureEngineer = new InfrastructureEngineer();
