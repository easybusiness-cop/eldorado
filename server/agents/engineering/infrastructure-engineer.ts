import { ToolGateway, toolGateway } from '../../tools/gateway.ts';

export class InfrastructureEngineer {
  private toolGateway: ToolGateway;

  constructor() {
    this.toolGateway = toolGateway || ToolGateway.getInstance();
  }

  async callPublicAPI(endpoint: string, params: any) {
    return await this.toolGateway.callPublicAPI(endpoint, params);
  }

  async deployToStaging() {
    return { success: true, environment: 'staging', url: 'https://staging.rufflo.com' };
  }
}

export const infrastructureEngineer = new InfrastructureEngineer();
