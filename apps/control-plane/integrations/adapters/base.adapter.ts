import { RiskLevel } from "../registry/integration.types";

export interface ToolExecutionContext {
  agentId: string;
  organizationId: string;
  tool: string;
  action: string;
  parameters: Record<string, any>;
  reason?: string;
  requestedBy?: string;
  correlationId?: string;
}

export interface ToolExecutionContract<T = any> {
  executionId: string;
  success: boolean;
  tool: string;
  action: string;
  data: T;
  error: string | null;
  metadata: {
    durationMs: number;
    provider: string;
    correlationId: string;
    riskLevel: RiskLevel;
  };
}

export abstract class BaseAdapter {
  abstract get provider(): string;

  abstract execute(context: ToolExecutionContext): Promise<any>;

  protected createResponse<T>(
    success: boolean,
    action: string,
    data: T,
    error: string | null,
    durationMs: number,
    correlationId: string,
    riskLevel: RiskLevel
  ): ToolExecutionContract<T> {
    return {
      executionId: `ex-ctr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      success,
      tool: this.provider,
      action,
      data,
      error,
      metadata: {
        durationMs,
        provider: this.provider,
        correlationId,
        riskLevel,
      },
    };
  }
}
