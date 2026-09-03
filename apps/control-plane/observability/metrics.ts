export interface ToolMetric {
  tool: string;
  action: string;
  latencyMs: number;
  success: boolean;
  costEstimate: number;
  timestamp: number;
}

export class ObservabilityCollector {
  private static toolMetrics: ToolMetric[] = [];
  private static approvalLatenciesMs: number[] = [];

  public static recordToolExecution(
    tool: string,
    action: string,
    latencyMs: number,
    success: boolean,
    costEstimate = 0
  ): void {
    this.toolMetrics.push({
      tool,
      action,
      latencyMs,
      success,
      costEstimate,
      timestamp: Date.now()
    });
  }

  public static recordApprovalLatency(durationMs: number): void {
    this.approvalLatenciesMs.push(durationMs);
  }

  public static getMetricsSummary(): {
    totalExecutions: number;
    successRate: number;
    averageLatencyMs: number;
    totalSpendsDollars: number;
    avgApprovalLatencyMs: number;
    breakdown: Record<string, { count: number; failures: number }>;
  } {
    const total = this.toolMetrics.length;
    const successes = this.toolMetrics.filter(m => m.success).length;
    const sumLatency = this.toolMetrics.reduce((sum, m) => sum + m.latencyMs, 0);
    const sumSpend = this.toolMetrics.reduce((sum, m) => sum + m.costEstimate, 0);

    const sumAppr = this.approvalLatenciesMs.reduce((sum, d) => sum + d, 0);
    const avgAppr = this.approvalLatenciesMs.length ? sumAppr / this.approvalLatenciesMs.length : 0;

    const breakdown: Record<string, { count: number; failures: number }> = {};
    for (const metric of this.toolMetrics) {
      const key = `${metric.tool}.${metric.action}`;
      if (!breakdown[key]) {
        breakdown[key] = { count: 0, failures: 0 };
      }
      breakdown[key].count++;
      if (!metric.success) {
        breakdown[key].failures++;
      }
    }

    return {
      totalExecutions: total,
      successRate: total ? successes / total : 1,
      averageLatencyMs: total ? sumLatency / total : 0,
      totalSpendsDollars: sumSpend,
      avgApprovalLatencyMs: avgAppr,
      breakdown
    };
  }
}
