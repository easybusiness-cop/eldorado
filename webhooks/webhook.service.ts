import { companyDb } from "../src/db/companyDb";

export interface WebhookEventPayload {
  id: string;
  source: "github" | "stripe" | "slack" | "custom";
  eventType: string;
  payload: Record<string, any>;
  timestamp: string;
}

export class WebhookService {
  private static processedWebhookIds: Set<string> = new Set();

  public static handleIncomingWebhook(event: WebhookEventPayload): { success: boolean; isDuplicate: boolean; eventId: string } {
    // Idempotency: Ignore duplicate webhooks
    if (this.processedWebhookIds.has(event.id)) {
      return { success: true, isDuplicate: true, eventId: event.id };
    }

    this.processedWebhookIds.add(event.id);

    // Save event to audit trail or event outbox
    companyDb.logAudit({
      id: `aud-wh-${Date.now()}`,
      agentId: "webhook-service",
      projectId: "prj-alpha",
      taskId: "wh-ingest",
      tool: event.source,
      action: `webhook.${event.eventType}`,
      inputHash: Buffer.from(JSON.stringify(event.payload)).toString("base64").slice(0, 20),
      result: `SUCCESS: Ingested webhook event of type ${event.eventType} from ${event.source}`,
      timestamp: event.timestamp,
      riskLevel: "low",
      approvalRequired: false,
      executionId: `wh-${event.id}`,
    });

    return { success: true, isDuplicate: false, eventId: event.id };
  }
}
