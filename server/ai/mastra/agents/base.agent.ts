import { AgentDefinition } from '../../../../shared/types/index.ts';

export interface MastraAgentConfig {
  id: string;
  name: string;
  role: string;
  department: AgentDefinition['department'];
  instructions: string;
  tools: string[];
  permissions: string[];
  managerId?: string;
  delegationRules: string[];
  approvalRequirements: string[];
}

export abstract class BaseMastraAgent {
  public config: MastraAgentConfig;

  constructor(config: MastraAgentConfig) {
    this.config = config;
  }

  public getId(): string {
    return this.config.id;
  }

  public getName(): string {
    return this.config.name;
  }

  public getDepartment(): string {
    return this.config.department;
  }

  public getInstructions(): string {
    return this.config.instructions;
  }

  public canUseTool(toolName: string): boolean {
    return this.config.tools.includes('*') || this.config.tools.includes(toolName);
  }

  public hasPermission(permission: string): boolean {
    return this.config.permissions.includes('*') || this.config.permissions.includes(permission);
  }

  public requiresApprovalFor(action: string): boolean {
    return this.config.approvalRequirements.some(req => action.toLowerCase().includes(req.toLowerCase()));
  }
}
