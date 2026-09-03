export interface AgentTrace {
  traceId: string;
  agentId: string;
  action: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  durationMs?: number;
  meta?: Record<string, any>;
}

export class MastraObservability {
  private static instance: MastraObservability;
  private traces: AgentTrace[] = [];

  private constructor() {}

  public static getInstance(): MastraObservability {
    if (!MastraObservability.instance) {
      MastraObservability.instance = new MastraObservability();
    }
    return MastraObservability.instance;
  }

  public startTrace(agentId: string, action: string, meta?: Record<string, any>): AgentTrace {
    const trace: AgentTrace = {
      traceId: `trc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      agentId,
      action,
      status: 'started',
      startTime: Date.now(),
      meta,
    };
    this.traces.unshift(trace);
    if (this.traces.length > 200) {
      this.traces.pop();
    }
    return trace;
  }

  public finishTrace(traceId: string, status: 'completed' | 'failed', meta?: Record<string, any>): AgentTrace | undefined {
    const trace = this.traces.find(t => t.traceId === traceId);
    if (trace) {
      trace.status = status;
      trace.endTime = Date.now();
      trace.durationMs = trace.endTime - trace.startTime;
      if (meta) {
        trace.meta = { ...trace.meta, ...meta };
      }
    }
    return trace;
  }

  public getRecentTraces(limit = 20): AgentTrace[] {
    return this.traces.slice(0, limit);
  }
}

export const mastraObservability = MastraObservability.getInstance();
