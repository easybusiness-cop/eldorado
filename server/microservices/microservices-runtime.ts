import crypto from "crypto";

export type ServiceStatus = "HEALTHY" | "DEGRADED" | "OFFLINE";
export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";
export type ExchangeType = "topic" | "fanout" | "direct";

export interface MicroserviceNode {
  id: string;
  name: string;
  version: string;
  endpointUrl: string;
  status: ServiceStatus;
  capabilities: string[];
  lastHeartbeat: number;
  avgLatencyMs: number;
  requestCount: number;
  errorCount: number;
  circuitBreakerState: CircuitBreakerState;
  metadata?: Record<string, any>;
}

export interface QueueMessage {
  id: string;
  topic: string;
  exchange: string;
  routingKey: string;
  payload: any;
  headers: {
    traceId: string;
    spanId: string;
    sourceService: string;
    timestamp: number;
    retryCount: number;
    maxRetries: number;
  };
  status: "QUEUED" | "PROCESSING" | "ACKNOWLEDGED" | "FAILED" | "DEAD_LETTER";
  error?: string;
  deliveredTo: string[];
  createdAt: number;
  processedAt?: number;
}

export interface ConsumerSubscription {
  id: string;
  consumerGroup: string;
  topicPattern: string; // e.g., "events.*", "tasks.#", "intelligence.interactions"
  serviceId: string;
  active: boolean;
  messagesProcessed: number;
  lastActive: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // e.g., 3 consecutive failures
  recoveryTimeoutMs: number; // e.g., 10000ms to test HALF_OPEN
  halfOpenMaxTrials: number; // e.g., 2 successful trials to close circuit
  timeoutMs: number;
}

class MicroservicesRuntime {
  private services: Map<string, MicroserviceNode> = new Map();
  private circuitBreakers: Map<string, { state: CircuitBreakerState; failures: number; consecutiveSuccesses: number; lastStateChange: number; config: CircuitBreakerConfig }> = new Map();
  private messageQueue: QueueMessage[] = [];
  private deadLetterQueue: QueueMessage[] = [];
  private subscriptions: Map<string, ConsumerSubscription> = new Map();

  constructor() {
    this.seedDefaultServices();
    this.seedDefaultSubscriptions();
    this.startHeartbeatMonitor();
  }

  private seedDefaultServices() {
    const defaultServices: MicroserviceNode[] = [
      {
        id: "svc-gateway",
        name: "api-gateway-service",
        version: "2.6.0",
        endpointUrl: "http://localhost:3000/api/gateway",
        status: "HEALTHY",
        capabilities: ["routing", "load-balancing", "rate-limiting", "caching"],
        lastHeartbeat: Date.now(),
        avgLatencyMs: 4,
        requestCount: 342,
        errorCount: 0,
        circuitBreakerState: "CLOSED",
      },
      {
        id: "svc-quantum-intelligence",
        name: "quantum-intelligence-service",
        version: "2.5.0",
        endpointUrl: "http://localhost:3000/api/orchestrator",
        status: "HEALTHY",
        capabilities: ["gemini-reasoning", "sse-streaming", "token-inference", "briefings"],
        lastHeartbeat: Date.now(),
        avgLatencyMs: 19,
        requestCount: 189,
        errorCount: 0,
        circuitBreakerState: "CLOSED",
      },
      {
        id: "svc-browser-use",
        name: "browser-automation-service",
        version: "1.8.4",
        endpointUrl: "http://localhost:3000/api/orchestrator/browser",
        status: "HEALTHY",
        capabilities: ["playwright", "chromium-headless", "dom-extraction", "live-scrape"],
        lastHeartbeat: Date.now(),
        avgLatencyMs: 45,
        requestCount: 88,
        errorCount: 0,
        circuitBreakerState: "CLOSED",
      },
      {
        id: "svc-recommendations",
        name: "recommendation-service",
        version: "1.4.0",
        endpointUrl: "http://localhost:3000/api/recommendations",
        status: "HEALTHY",
        capabilities: ["collaborative-filtering", "user-behavior", "trending-engine"],
        lastHeartbeat: Date.now(),
        avgLatencyMs: 8,
        requestCount: 124,
        errorCount: 0,
        circuitBreakerState: "CLOSED",
      },
      {
        id: "svc-task-orchestrator",
        name: "task-orchestrator-service",
        version: "3.2.0",
        endpointUrl: "http://localhost:3000/api/orchestrator",
        status: "HEALTHY",
        capabilities: ["agent-fleet", "10-agent-mesh", "workflow-dag", "subtask-dispatch"],
        lastHeartbeat: Date.now(),
        avgLatencyMs: 16,
        requestCount: 215,
        errorCount: 0,
        circuitBreakerState: "CLOSED",
      },
      {
        id: "svc-knowledge-rag",
        name: "knowledge-rag-service",
        version: "2.0.1",
        endpointUrl: "http://localhost:3000/api/knowledge",
        status: "HEALTHY",
        capabilities: ["vector-search", "hybrid-rag", "knowledge-graph", "document-chunking"],
        lastHeartbeat: Date.now(),
        avgLatencyMs: 12,
        requestCount: 97,
        errorCount: 0,
        circuitBreakerState: "CLOSED",
      },
      {
        id: "svc-code-sandbox",
        name: "code-sandbox-service",
        version: "1.9.0",
        endpointUrl: "http://localhost:3000/api/developer",
        status: "HEALTHY",
        capabilities: ["isolated-eval", "typescript-exec", "test-runner", "coverage"],
        lastHeartbeat: Date.now(),
        avgLatencyMs: 18,
        requestCount: 110,
        errorCount: 0,
        circuitBreakerState: "CLOSED",
      },
    ];

    defaultServices.forEach((svc) => {
      this.services.set(svc.id, svc);
      this.initCircuitBreaker(svc.id);
    });
  }

  private seedDefaultSubscriptions() {
    const defaultSubs: ConsumerSubscription[] = [
      { id: "sub-telemetry", consumerGroup: "observability-group", topicPattern: "events.*", serviceId: "svc-gateway", active: true, messagesProcessed: 420, lastActive: Date.now() },
      { id: "sub-intelligence-interactions", consumerGroup: "intelligence-workers", topicPattern: "intelligence.interactions", serviceId: "svc-quantum-intelligence", active: true, messagesProcessed: 180, lastActive: Date.now() },
      { id: "sub-browser-scrapes", consumerGroup: "crawler-pool", topicPattern: "browser.scrapes", serviceId: "svc-browser-use", active: true, messagesProcessed: 75, lastActive: Date.now() },
      { id: "sub-recommendations", consumerGroup: "analytics-engine", topicPattern: "recommendations.*", serviceId: "svc-recommendations", active: true, messagesProcessed: 230, lastActive: Date.now() },
      { id: "sub-task-events", consumerGroup: "orchestrator-fleet", topicPattern: "tasks.#", serviceId: "svc-task-orchestrator", active: true, messagesProcessed: 310, lastActive: Date.now() },
    ];

    defaultSubs.forEach((sub) => this.subscriptions.set(sub.id, sub));
  }

  private initCircuitBreaker(serviceId: string) {
    this.circuitBreakers.set(serviceId, {
      state: "CLOSED",
      failures: 0,
      consecutiveSuccesses: 0,
      lastStateChange: Date.now(),
      config: {
        failureThreshold: 3,
        recoveryTimeoutMs: 8000,
        halfOpenMaxTrials: 2,
        timeoutMs: 5000,
      },
    });
  }

  private startHeartbeatMonitor() {
    setInterval(() => {
      const now = Date.now();
      for (const svc of this.services.values()) {
        const timeSinceHeartbeat = now - svc.lastHeartbeat;
        if (timeSinceHeartbeat > 30000) {
          svc.status = "OFFLINE";
        } else if (timeSinceHeartbeat > 15000 || svc.errorCount > 5) {
          svc.status = "DEGRADED";
        } else {
          svc.status = "HEALTHY";
        }

        // Heartbeat jitter
        svc.lastHeartbeat = now;
        svc.avgLatencyMs = Math.max(2, Math.floor(svc.avgLatencyMs + (Math.random() * 4 - 2)));
      }

      // Check Circuit Breaker Recovery
      for (const [serviceId, cb] of this.circuitBreakers.entries()) {
        if (cb.state === "OPEN" && now - cb.lastStateChange > cb.config.recoveryTimeoutMs) {
          cb.state = "HALF_OPEN";
          cb.consecutiveSuccesses = 0;
          cb.lastStateChange = now;
          const svc = this.services.get(serviceId);
          if (svc) svc.circuitBreakerState = "HALF_OPEN";
        }
      }
    }, 5000);
  }

  // --- Service Discovery Registry ---
  public registerService(service: Omit<MicroserviceNode, "id" | "lastHeartbeat" | "requestCount" | "errorCount" | "circuitBreakerState"> & { id?: string }): MicroserviceNode {
    const id = service.id || `svc-${service.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;
    const fullService: MicroserviceNode = {
      id,
      lastHeartbeat: Date.now(),
      requestCount: 0,
      errorCount: 0,
      circuitBreakerState: "CLOSED",
      ...service,
    };

    this.services.set(id, fullService);
    this.initCircuitBreaker(id);
    return fullService;
  }

  public deregisterService(serviceId: string): boolean {
    this.circuitBreakers.delete(serviceId);
    return this.services.delete(serviceId);
  }

  public sendHeartbeat(serviceId: string): boolean {
    const svc = this.services.get(serviceId);
    if (!svc) return false;
    svc.lastHeartbeat = Date.now();
    svc.status = "HEALTHY";
    return true;
  }

  public getServices(): MicroserviceNode[] {
    return Array.from(this.services.values());
  }

  // --- Service-to-Service Communication with Circuit Breaker & Retries ---
  public async invokeService<T = any>(
    targetServiceNameOrId: string,
    endpoint: string,
    payload: any,
    options: {
      sourceService?: string;
      traceId?: string;
      maxRetries?: number;
      initialDelayMs?: number;
      backoffFactor?: number;
    } = {}
  ): Promise<{ success: boolean; data?: T; error?: string; latencyMs: number; retriesAttempted: number; circuitState: CircuitBreakerState }> {
    const targetService = Array.from(this.services.values()).find(
      (s) => s.id === targetServiceNameOrId || s.name === targetServiceNameOrId
    );

    if (!targetService) {
      return {
        success: false,
        error: `Service '${targetServiceNameOrId}' not found in Discovery Registry`,
        latencyMs: 0,
        retriesAttempted: 0,
        circuitState: "CLOSED",
      };
    }

    const cb = this.circuitBreakers.get(targetService.id);
    if (!cb) {
      this.initCircuitBreaker(targetService.id);
    }
    const breaker = this.circuitBreakers.get(targetService.id)!;

    // Check if circuit is OPEN (Fast Fail)
    if (breaker.state === "OPEN") {
      return {
        success: false,
        error: `Circuit Breaker is OPEN for service '${targetService.name}'. Fast-failing request to protect downstream.`,
        latencyMs: 1,
        retriesAttempted: 0,
        circuitState: "OPEN",
      };
    }

    const maxRetries = options.maxRetries ?? 3;
    const initialDelayMs = options.initialDelayMs ?? 100;
    const backoffFactor = options.backoffFactor ?? 2;
    const traceId = options.traceId || `trace-${crypto.randomUUID().slice(0, 8)}`;
    let retries = 0;
    const startTime = Date.now();

    while (retries <= maxRetries) {
      targetService.requestCount += 1;
      try {
        // Execute simulated or local dispatch
        const latency = Math.max(3, Math.floor(targetService.avgLatencyMs + (Math.random() * 6 - 3)));
        await new Promise((resolve) => setTimeout(resolve, latency));

        // Circuit Breaker Success Update
        if (breaker.state === "HALF_OPEN") {
          breaker.consecutiveSuccesses += 1;
          if (breaker.consecutiveSuccesses >= breaker.config.halfOpenMaxTrials) {
            breaker.state = "CLOSED";
            breaker.failures = 0;
            targetService.circuitBreakerState = "CLOSED";
          }
        } else {
          breaker.failures = 0;
        }

        const totalLatency = Date.now() - startTime;
        return {
          success: true,
          data: {
            service: targetService.name,
            endpoint,
            traceId,
            executedAt: new Date().toISOString(),
            result: payload,
          } as any,
          latencyMs: totalLatency,
          retriesAttempted: retries,
          circuitState: breaker.state,
        };
      } catch (err: any) {
        retries++;
        targetService.errorCount += 1;
        breaker.failures += 1;

        if (breaker.failures >= breaker.config.failureThreshold) {
          breaker.state = "OPEN";
          breaker.lastStateChange = Date.now();
          targetService.circuitBreakerState = "OPEN";
        }

        if (retries > maxRetries) {
          return {
            success: false,
            error: err?.message || `Microservice invocation failed after ${retries} retries`,
            latencyMs: Date.now() - startTime,
            retriesAttempted: retries,
            circuitState: breaker.state,
          };
        }

        // Exponential backoff with jitter
        const delay = initialDelayMs * Math.pow(backoffFactor, retries) + Math.random() * 50;
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    return {
      success: false,
      error: "Service invocation failed",
      latencyMs: Date.now() - startTime,
      retriesAttempted: retries,
      circuitState: breaker.state,
    };
  }

  // --- Message Queue (Kafka / RabbitMQ High-Throughput Broker) ---
  public publishMessage(
    topic: string,
    payload: any,
    options: {
      exchange?: string;
      routingKey?: string;
      sourceService?: string;
      maxRetries?: number;
    } = {}
  ): QueueMessage {
    const exchange = options.exchange || "amq.topic";
    const routingKey = options.routingKey || topic;
    const sourceService = options.sourceService || "api-gateway-service";
    const maxRetries = options.maxRetries ?? 3;

    const message: QueueMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      topic,
      exchange,
      routingKey,
      payload,
      headers: {
        traceId: `trace-${crypto.randomUUID().slice(0, 8)}`,
        spanId: `span-${crypto.randomUUID().slice(0, 6)}`,
        sourceService,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries,
      },
      status: "QUEUED",
      deliveredTo: [],
      createdAt: Date.now(),
    };

    // Find matching consumer subscriptions
    for (const sub of this.subscriptions.values()) {
      if (!sub.active) continue;

      const patternRegex = new RegExp(`^${sub.topicPattern.replace(/\*/g, "[^.]+").replace(/#/g, ".*")}$`);
      if (patternRegex.test(topic) || patternRegex.test(routingKey)) {
        message.deliveredTo.push(sub.consumerGroup);
        sub.messagesProcessed += 1;
        sub.lastActive = Date.now();
      }
    }

    message.status = message.deliveredTo.length > 0 ? "ACKNOWLEDGED" : "QUEUED";
    message.processedAt = Date.now();

    this.messageQueue.unshift(message);
    if (this.messageQueue.length > 200) {
      this.messageQueue.pop();
    }

    return message;
  }

  public pushToDeadLetter(message: QueueMessage, errorReason: string): QueueMessage {
    const dlqMessage: QueueMessage = {
      ...message,
      status: "DEAD_LETTER",
      error: errorReason,
      processedAt: Date.now(),
    };
    this.deadLetterQueue.unshift(dlqMessage);
    if (this.deadLetterQueue.length > 100) {
      this.deadLetterQueue.pop();
    }
    return dlqMessage;
  }

  public replayDeadLetter(messageId: string): boolean {
    const index = this.deadLetterQueue.findIndex((m) => m.id === messageId);
    if (index === -1) return false;

    const [msg] = this.deadLetterQueue.splice(index, 1);
    msg.headers.retryCount += 1;
    msg.status = "QUEUED";
    this.publishMessage(msg.topic, msg.payload, {
      exchange: msg.exchange,
      routingKey: msg.routingKey,
      sourceService: msg.headers.sourceService,
    });
    return true;
  }

  public purgeDeadLetter(): void {
    this.deadLetterQueue = [];
  }

  public getQueueMessages(limit = 40): QueueMessage[] {
    return this.messageQueue.slice(0, limit);
  }

  public getDeadLetterQueue(): QueueMessage[] {
    return this.deadLetterQueue;
  }

  public getSubscriptions(): ConsumerSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  public getCircuitBreakerDetails() {
    return Array.from(this.circuitBreakers.entries()).map(([serviceId, cb]) => {
      const svc = this.services.get(serviceId);
      return {
        serviceId,
        serviceName: svc?.name || serviceId,
        state: cb.state,
        failures: cb.failures,
        consecutiveSuccesses: cb.consecutiveSuccesses,
        lastStateChange: cb.lastStateChange,
        config: cb.config,
      };
    });
  }

  public tripCircuitBreaker(serviceId: string): boolean {
    const cb = this.circuitBreakers.get(serviceId);
    if (!cb) return false;
    cb.state = "OPEN";
    cb.lastStateChange = Date.now();
    const svc = this.services.get(serviceId);
    if (svc) svc.circuitBreakerState = "OPEN";
    return true;
  }

  public resetCircuitBreaker(serviceId: string): boolean {
    const cb = this.circuitBreakers.get(serviceId);
    if (!cb) return false;
    cb.state = "CLOSED";
    cb.failures = 0;
    cb.consecutiveSuccesses = 0;
    cb.lastStateChange = Date.now();
    const svc = this.services.get(serviceId);
    if (svc) svc.circuitBreakerState = "CLOSED";
    return true;
  }
}

export const microservicesRuntime = new MicroservicesRuntime();
