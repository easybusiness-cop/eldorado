import vm from "vm";
import { debugTelemetry } from "../telemetry/debugTelemetry.ts";

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
  context = {}
): AppliedSystemModule {
  const cleanCode = (code || "").trim();
  const consoleLogs: string[] = [];
  const moduleName = name || `Auto-Patch-${Date.now().toString().slice(-4)} (${source})`;

  const sandbox = {
    console: {
      log: (...args: any[]) => consoleLogs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
      error: (...args: any[]) => consoleLogs.push("[ERROR] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
      warn: (...args: any[]) => consoleLogs.push("[WARN] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
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

  let executionResult: any = null;
  let status: "active" | "error" = "active";

  try {
    const vmContext = vm.createContext(sandbox);
    const script = new vm.Script(`
      (() => {
        try {
          ${cleanCode}
        } catch (e) {
          console.error(e.message);
          return { error: e.message };
        }
      })()
    `);

    executionResult = script.runInContext(vmContext, { timeout: 3500 });
    if (executionResult && executionResult.error) {
      status = "error";
    }
  } catch (err: any) {
    status = "error";
    consoleLogs.push(`[FATAL] ${err.message}`);
    executionResult = { error: err.message };
  }

  // Increment patches and telemetry
  debugTelemetry.patchesApplied += 1;
  debugTelemetry.logs.unshift({
    id: `dbg-auto-apply-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    level: status === "active" ? "success" : "error",
    message: `[System Code Applied] "${moduleName}" deployed to ${target} by ${source} (Status: ${status}).`,
  });

  const newModule: AppliedSystemModule = {
    id: `sys-mod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: moduleName,
    code: cleanCode,
    source,
    appliedAt: Date.now(),
    status,
    version: 1,
    logs: consoleLogs,
    output: executionResult,
    target,
  };

  appliedSystemModules.unshift(newModule);
  return newModule;
}
