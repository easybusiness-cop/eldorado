import fs from "fs";
import path from "path";

export interface AuditLogEntry {
  eventId: string;
  timestamp: string;
  actor: string;
  tenant: string;
  action: string;
  resource: string;
  policyDecision: "allow" | "deny";
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  findings: string[];
  isolationLevel: string;
  networkIsolated: boolean;
  credentialsStripped: boolean;
  durationMs?: number;
}

export class SecurityAuditLedger {
  private static readonly LEDGER_PATH = path.join(process.cwd(), "security_audit_ledger.json");

  /**
   * Commits a structured event entry to the immutable-like server-side audit ledger.
   */
  public static log(entry: Omit<AuditLogEntry, "eventId" | "timestamp">) {
    const fullEntry: AuditLogEntry = {
      eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    try {
      let ledgerList: AuditLogEntry[] = [];
      if (fs.existsSync(this.LEDGER_PATH)) {
        try {
          const raw = fs.readFileSync(this.LEDGER_PATH, "utf8");
          ledgerList = JSON.parse(raw);
          if (!Array.isArray(ledgerList)) {
            ledgerList = [];
          }
        } catch (e) {
          // If corrupted, fallback to clean list to prevent crash
          ledgerList = [];
        }
      }

      ledgerList.unshift(fullEntry);
      
      // Restrict log length to last 200 entries to prevent infinite memory growth
      if (ledgerList.length > 200) {
        ledgerList = ledgerList.slice(0, 200);
      }

      fs.writeFileSync(this.LEDGER_PATH, JSON.stringify(ledgerList, null, 2), "utf8");
      console.log(`[AUDIT_LEDGER_SUCCESS] Committed security event: ${fullEntry.eventId} [${fullEntry.action}] - Decision: ${fullEntry.policyDecision.toUpperCase()}`);
    } catch (err: any) {
      console.error("[AUDIT_LEDGER_FAILURE] Failed to persist secure audit record:", err.message);
    }
  }

  /**
   * Retrieves all committed security audit records.
   */
  public static getLedger(): AuditLogEntry[] {
    try {
      if (fs.existsSync(this.LEDGER_PATH)) {
        const raw = fs.readFileSync(this.LEDGER_PATH, "utf8");
        return JSON.parse(raw) || [];
      }
    } catch (e) {
      console.error("[AUDIT_LEDGER_READ_ERROR] Failed to read ledger:", e);
    }
    return [];
  }
}
