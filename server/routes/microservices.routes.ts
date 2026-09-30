import { Router, Request, Response } from "express";
import { microservicesRuntime } from "../microservices/microservices-runtime.ts";
import { requireCapability } from "../security/auth.middleware.ts";

export const microservicesRouter = Router();

// --- Service Discovery ---
microservicesRouter.get("/services", (_req: Request, res: Response) => {
  const services = microservicesRuntime.getServices();
  res.json({
    total: services.length,
    services,
  });
});

microservicesRouter.post("/register", requireCapability("system:admin"), (req: Request, res: Response) => {
  const { name, version, endpointUrl, capabilities = [] } = req.body;
  if (!name || !endpointUrl) {
    return res.status(400).json({ error: "Missing required service parameters (name, endpointUrl)" });
  }

  const registered = microservicesRuntime.registerService({
    name,
    version: version || "1.0.0",
    endpointUrl,
    status: "HEALTHY",
    capabilities,
    avgLatencyMs: 10,
  });

  res.json({ success: true, service: registered });
});

microservicesRouter.post("/heartbeat/:id", (req: Request, res: Response) => {
  const success = microservicesRuntime.sendHeartbeat(req.params.id);
  res.json({ success });
});

microservicesRouter.delete("/services/:id", requireCapability("system:admin"), (req: Request, res: Response) => {
  const success = microservicesRuntime.deregisterService(req.params.id);
  res.json({ success });
});

// --- Service-to-Service Invocation with Fault Tolerance & Retries ---
microservicesRouter.post("/invoke", async (req: Request, res: Response) => {
  const { targetService, endpoint = "/process", payload = {}, options = {} } = req.body;

  if (!targetService) {
    return res.status(400).json({ error: "Missing targetService parameter" });
  }

  const result = await microservicesRuntime.invokeService(targetService, endpoint, payload, options);
  res.json(result);
});

// --- Message Queue Broker & Event Bus ---
microservicesRouter.get("/queue/messages", (_req: Request, res: Response) => {
  const messages = microservicesRuntime.getQueueMessages();
  res.json({
    total: messages.length,
    messages,
  });
});

microservicesRouter.post("/queue/publish", (req: Request, res: Response) => {
  const { topic, payload, exchange = "amq.topic", routingKey, sourceService } = req.body;

  if (!topic || payload === undefined) {
    return res.status(400).json({ error: "Missing topic or payload" });
  }

  const message = microservicesRuntime.publishMessage(topic, payload, {
    exchange,
    routingKey,
    sourceService,
  });

  res.json({ success: true, message });
});

microservicesRouter.get("/queue/subscriptions", (_req: Request, res: Response) => {
  res.json({ subscriptions: microservicesRuntime.getSubscriptions() });
});

microservicesRouter.get("/queue/dlq", (_req: Request, res: Response) => {
  const dlq = microservicesRuntime.getDeadLetterQueue();
  res.json({ total: dlq.length, dlq });
});

microservicesRouter.post("/queue/dlq/replay", requireCapability("system:admin"), (req: Request, res: Response) => {
  const { messageId } = req.body;
  if (!messageId) {
    return res.status(400).json({ error: "Missing messageId" });
  }
  const success = microservicesRuntime.replayDeadLetter(messageId);
  res.json({ success });
});

microservicesRouter.post("/queue/dlq/purge", requireCapability("system:admin"), (_req: Request, res: Response) => {
  microservicesRuntime.purgeDeadLetter();
  res.json({ success: true, message: "Dead Letter Queue purged" });
});

// --- Circuit Breaker Management ---
microservicesRouter.get("/circuit-breakers", (_req: Request, res: Response) => {
  res.json({ circuitBreakers: microservicesRuntime.getCircuitBreakerDetails() });
});

microservicesRouter.post("/circuit-breakers/trip", requireCapability("system:admin"), (req: Request, res: Response) => {
  const { serviceId } = req.body;
  const tripped = microservicesRuntime.tripCircuitBreaker(serviceId);
  res.json({ success: tripped });
});

microservicesRouter.post("/circuit-breakers/reset", requireCapability("system:admin"), (req: Request, res: Response) => {
  const { serviceId } = req.body;
  const reset = microservicesRuntime.resetCircuitBreaker(serviceId);
  res.json({ success: reset });
});
