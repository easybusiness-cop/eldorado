import { BaseAdapter, ToolExecutionContext } from "./base.adapter";
import { companyDb } from "../../../../src/db/companyDb";

export class DatabaseAdapter extends BaseAdapter {
  get provider(): string {
    return "postgresql";
  }

  public async execute(context: ToolExecutionContext): Promise<any> {
    const start = Date.now();
    const correlationId = context.correlationId || `corr-${Date.now()}`;
    const { action, parameters } = context;

    try {
      const sqlQuery = (parameters.query || "").trim();
      if (!sqlQuery) {
        throw new Error("Database Adapter Error: Parameter 'query' is required.");
      }

      const sqlLower = sqlQuery.toLowerCase();

      // Enforce rigorous SQL checks
      const isDestructive =
        sqlLower.includes("drop ") ||
        sqlLower.includes("truncate ") ||
        sqlLower.includes("alter ") ||
        (sqlLower.includes("delete ") && !sqlLower.includes("where "));

      if (isDestructive) {
        throw new Error(`CRITICAL ACCESS DENIED: Dangerous SQL command detected. Destructive operations (DROP, TRUNCATE, ALTER, DELETE without constraints) are permanently blocked through the security gateway.`);
      }

      // Check agent database write authorization (default to read-only for agents)
      const isWrite = sqlLower.includes("insert ") || sqlLower.includes("update ") || sqlLower.includes("delete ");
      const agentReadOnlyDefault = parameters.readOnly ?? true;

      if (isWrite && agentReadOnlyDefault) {
        throw new Error("ACCESS DENIED: Production database context defaults to READ-ONLY. Elevated writes must go through explicit tool gateway approval channels.");
      }

      // Execute queries safely inside simulated DB engine
      await new Promise((resolve) => setTimeout(resolve, 80)); // Mock network roundtrip latency

      let results: any[] = [];
      if (sqlLower.includes("select * from employees") || sqlLower.includes("select * from employee")) {
        results = companyDb.getAgentsList().map(e => ({ id: e.id, name: e.name, role: e.role, department: e.department }));
      } else if (sqlLower.includes("select * from projects") || sqlLower.includes("select * from project")) {
        results = companyDb.getProjects().map(p => ({ id: p.id, name: p.name, budget: p.budget, status: p.status }));
      } else if (sqlLower.includes("select * from audit_events") || sqlLower.includes("select * from audit")) {
        results = companyDb.getAudits().slice(0, 10);
      } else {
        results = [
          {
            affectedRows: isWrite ? 1 : 0,
            status: "SUCCESS",
            executedQuery: sqlQuery,
            timestamp: Date.now()
          }
        ];
      }

      return this.createResponse(true, action, { rows: results, count: results.length }, null, Date.now() - start, correlationId, isDestructive ? "CRITICAL" : isWrite ? "HIGH" : "LOW");
    } catch (err: any) {
      return this.createResponse(false, action, null, err.message, Date.now() - start, correlationId, "LOW");
    }
  }
}
