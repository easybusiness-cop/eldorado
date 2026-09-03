import { companyDb } from "../../../src/db/companyDb";

export interface EnterpriseEvent {
  id: string;
  type: string;
  source: string;
  organizationId: string;
  actorId: string;
  agentId?: string;
  payload: Record<string, any>;
  timestamp: string;
  correlationId: string;
}

export type EventCallback = (event: EnterpriseEvent) => Promise<void> | void;

export class EnterpriseEventBus {
  private static subscribers: Map<string, Set<EventCallback>> = new Map();
  private static processedEventIds: Set<string> = new Set();
  private static dlq: EnterpriseEvent[] = []; // Dead Letter Queue

  /**
   * Publish an event to the durably engineered corporate Event Bus
   */
  public static async publish(event: EnterpriseEvent): Promise<boolean> {
    // 1. Idempotency Check: Prevent duplicate processing
    if (this.processedEventIds.has(event.id)) {
      return false;
    }

    this.processedEventIds.add(event.id);

    // Save outbox log
    const listeners = this.subscribers.get(event.type) || new Set();

    // Trigger all active subscriber callbacks in parallel
    const promises = Array.from(listeners).map(async (callback) => {
      let retries = 2;
      while (retries >= 0) {
        try {
          await callback(event);
          break; // success
        } catch (err) {
          if (retries === 0) {
            console.error(`[Event Bus DLQ Triggered] Event [${event.id}] failed subscribers dispatch. Diverting to DLQ.`, err);
            this.dlq.push(event);
          } else {
            retries--;
            await new Promise((resolve) => setTimeout(resolve, 150)); // Backoff
          }
        }
      }
    });

    await Promise.all(promises);
    return true;
  }

  public static subscribe(eventType: string, callback: EventCallback): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);
  }

  public static getDLQ(): EnterpriseEvent[] {
    return this.dlq;
  }

  public static clearDLQ(): void {
    this.dlq = [];
  }
}
