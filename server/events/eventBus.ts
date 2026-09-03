import { EventEmitter } from "events";
import { companyDb } from "../../src/db/companyDb.ts";

export class CompanyEventBus extends EventEmitter {
  emitEvent(eventName: string, payload: any) {
    console.log(`[EventBus] Emitted: ${eventName}`, payload);
    this.emit(eventName, payload);
    
    // Auto-log event under audit trail
    try {
      companyDb.logAudit({
        id: `aud-evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        agentId: payload.agentId || "system",
        projectId: payload.projectId || "prj-alpha",
        taskId: payload.taskId,
        tool: "event_bus",
        action: `Event "${eventName}" triggered: ${payload.message || 'System Dispatch'}`,
        inputHash: Buffer.from(JSON.stringify(payload)).toString("base64").slice(0, 20),
        result: `SUCCESS: Event propagated to active workforce.`,
        timestamp: new Date().toISOString(),
        riskLevel: "low",
        approvalRequired: false,
        executionId: `ex-evt-${Date.now()}`
      });
    } catch (e) {
      console.error("EventBus audit logging error:", e);
    }
  }
}

export const eventBus = new CompanyEventBus();
