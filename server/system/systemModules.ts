import vm from "vm";
import { debugTelemetry } from "../telemetry/debugTelemetry.ts";
import { ServerSecurityBroker, PolicyContext } from "../security/executionBroker.ts";

export interface AppliedSystemModule {
  id: string;
  name: string;
  code: string;
  source: string;
  appliedAt: number;
  status: "active" | "error" | "disabled";
  version: number;
  logs: string[];
  output?: any;
  target: "system_runtime" | "fleet_engine" | "website_dom";
  riskScore?: number;
  riskLevel?: string;
}

export const appliedSystemModules: AppliedSystemModule[] = [
  {
    id: "sys-mod-baseline-01",
    name: "Zero-Trust Perimeter & Hot-Patch Baseline",
    code: `// Core Runtime Baseline\nreturn {\n  status: "ONLINE",\n  hotPatchEngine: "ACTIVE",\n  vmSandbox: "ISOLATED",\n  timestamp: Date.now()\n};`,
    source: "system_core",
    appliedAt: Date.now() - 7200000,
    status: "active",
    version: 1,
    logs: ["[INIT] Zero-Trust Perimeter Baseline mounted into active backend system runtime."],
    output: { status: "ONLINE", hotPatchEngine: "ACTIVE", vmSandbox: "ISOLATED" },
    target: "system_runtime",
  },
];

// Helper: Safely Execute and Apply Code to System Runtime
export function executeAndApplySystemCode(
  code: string,
  name?: string,
  source = "ruflo_coder",
  target: "system_runtime" | "fleet_engine" | "website_dom" = "system_runtime",
  context: any = {}
): AppliedSystemModule {
  const cleanCode = (code || "").trim();
  const consoleLogs: string[] = [];
  const moduleName = name || `Auto-Patch-${Date.now().toString().slice(-4)} (${source})`;

  // 1. Extract context variables for Server-Side policy evaluation
  const userProfile = context?.userProfile || {};
  const actorRole = userProfile.role || context?.role || source || "guest";
  const tenantId = context?.tenantId || "munderdiffl-default-tenant";

  const policyCtx: PolicyContext = {
    actor: actorRole,
    tenant: tenantId,
    capability: "SYSTEM_CODE_EXECUTION",
    resource: target,
  };

  // 2. Define standard VM execution block
  const actualRunner = (cleanScriptCode: string) => {
    const localLogs: string[] = [];
    const sandbox = {
      console: {
        log: (...args: any[]) => localLogs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
        error: (...args: any[]) => localLogs.push("[ERROR] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
        warn: (...args: any[]) => localLogs.push("[WARN] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
      },
      Math,
      Date,
      JSON,
      parseInt,
      parseFloat,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      systemRuntime: {
        activeWorkers: 9,
        hotPatchVersion: debugTelemetry.patchesApplied + 1,
        fleetState: "OPERATIONAL",
      },
      userContext: context,
    };

    let scriptResult: any = null;
    let runStatus: "active" | "error" = "active";

    try {
      const vmContext = vm.createContext(sandbox);
      const script = new vm.Script(`
        (() => {
          try {
            ${cleanScriptCode}
          } catch (e) {
            console.error(e.message);
            return { error: e.message };
          }
        })()
      `);

      scriptResult = script.runInContext(vmContext, { timeout: 3500 });
      if (scriptResult && scriptResult.error) {
        runStatus = "error";
      }
    } catch (err: any) {
      runStatus = "error";
      localLogs.push(`[FATAL] ${err.message}`);
      scriptResult = { error: err.message };
    }

    return {
      status: runStatus,
      output: scriptResult,
      logs: localLogs,
    };
  };

  // 3. Dispatch to Server-side Security Broker (evaluating policy, scanning risk, isolated workers compilation)
  const report = ServerSecurityBroker.brokerExecution(cleanCode, policyCtx, actualRunner);

  const finalStatus = report.success ? "active" : "error";

  // Increment patches and telemetry
  debugTelemetry.patchesApplied += 1;
  debugTelemetry.logs.unshift({
    id: `dbg-auto-apply-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    level: finalStatus === "active" ? "success" : "error",
    message: `[System Broker Applied] "${moduleName}" processed on ${target} (Risk: ${report.risk.riskLevel}, Status: ${finalStatus}).`,
  });

  const newModule: AppliedSystemModule = {
    id: `sys-mod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: moduleName,
    code: cleanCode,
    source,
    appliedAt: Date.now(),
    status: finalStatus,
    version: 1,
    logs: report.logs,
    output: report.output,
    target,
    riskScore: report.risk.riskScore,
    riskLevel: report.risk.riskLevel,
  };

  appliedSystemModules.unshift(newModule);
  return newModule;
}
