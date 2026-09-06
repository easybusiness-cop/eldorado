/**
 * Rufflo Autonomous Agent Fleet - OpenTelemetry Tracing SDK
 */

export interface Span {
  id: string;
  traceId: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  attributes: Record<string, any>;
  status: 'UNSET' | 'OK' | 'ERROR';
  error?: string;
}

export class TracingSDK {
  private static instance: TracingSDK;
  private spans: Span[] = [];
  private endpoint: string;

  private constructor() {
    this.endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
  }

  public static getInstance(): TracingSDK {
    if (!TracingSDK.instance) {
      TracingSDK.instance = new TracingSDK();
    }
    return TracingSDK.instance;
  }

  public startSpan(name: string, attributes: Record<string, any> = {}): Span {
    const traceId = `trc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const span: Span = {
      id: `spn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      traceId,
      name,
      startTime: Date.now(),
      attributes: {
        'service.name': 'rufflo-agent-fleet',
        ...attributes,
      },
      status: 'UNSET',
    };
    this.spans.push(span);
    if (this.spans.length > 2000) {
      this.spans.shift();
    }
    return span;
  }

  public endSpan(span: Span, status: 'OK' | 'ERROR' = 'OK', error?: string): void {
    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    span.status = status;
    if (error) {
      span.error = error;
    }
  }

  public get trace() {
    return {
      getTracer: (_name: string = 'rufflo') => ({
        startSpan: (spanName: string, attributes: Record<string, any> = {}) => {
          const s = this.startSpan(spanName, attributes);
          return {
            ...s,
            setAttribute: (key: string, val: any) => {
              s.attributes[key] = val;
            },
            end: (status: 'OK' | 'ERROR' = 'OK') => {
              this.endSpan(s, status);
            },
          };
        },
      }),
    };
  }

  public async runWithTrace<T>(name: string, attributes: Record<string, any>, fn: () => Promise<T>): Promise<T> {
    const span = this.startSpan(name, attributes);
    try {
      const result = await fn();
      this.endSpan(span, 'OK');
      return result;
    } catch (err: any) {
      this.endSpan(span, 'ERROR', err?.message || String(err));
      throw err;
    }
  }

  public getSpans(limit: number = 100): Span[] {
    return this.spans.slice(-limit);
  }
}

export const tracingSDK = TracingSDK.getInstance();
