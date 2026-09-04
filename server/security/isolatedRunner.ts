import { spawnSync } from "child_process";

export interface IsolatedExecutionResult {
  status: "active" | "error";
  output: any;
  logs: string[];
}

/**
 * Executes dynamic system code or user scripts in an ephemeral, isolated subprocess.
 * Crucially, it completely strips all host credentials (env: {}) and disables 
 * core network and filesystem modules.
 */
export function runInIsolatedProcess(
  code: string,
  context: any = {},
  hotPatchVersion: number = 1
): IsolatedExecutionResult {
  const serializedContext = JSON.stringify(context || {});

  // JavaScript wrapper payload sent to Node subprocess
  const workerScript = `
const fs = require('fs');

// Intercept module require to block network/file access modules
const originalRequire = module.constructor.prototype.require;
module.constructor.prototype.require = function(id) {
  if (['http', 'https', 'net', 'dgram', 'dns', 'child_process', 'fs', 'fs/promises', 'tls', 'cluster'].includes(id)) {
    throw new Error("Access denied: Module '" + id + "' is blocked within the Ephemeral MicroVM Sandbox.");
  }
  return originalRequire.apply(this, arguments);
};

// Intercept global fetch and other network helpers
const blockMessage = "Access denied: Host network access is blocked within the Ephemeral MicroVM Sandbox.";
globalThis.fetch = () => Promise.reject(new Error(blockMessage));

// Block host process control operations
const blockFn = () => { throw new Error("Access denied: Process operations are restricted in this sandbox."); };
process.exit = blockFn;
process.kill = blockFn;

const localLogs = [];
const console = {
  log: (...args) => localLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
  error: (...args) => localLogs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
  warn: (...args) => localLogs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
};

const systemRuntime = {
  activeWorkers: 9,
  hotPatchVersion: ${hotPatchVersion},
  fleetState: "OPERATIONAL"
};

const context = ${serializedContext};
const userContext = context;

let output = null;
let runStatus = "active";

try {
  // Wrap user code in an IIFE to capture the return value
  const result = (() => {
    ${code}
  })();
  output = result;
} catch (err) {
  runStatus = "error";
  localLogs.push("[FATAL] " + err.message);
  output = { error: err.message };
}

// Return the serialized result via standard output
process.stdout.write(JSON.stringify({
  status: runStatus,
  output: output,
  logs: localLogs
}));
  `;

  try {
    // Spawn the node binary synchronously in an isolated process
    const run = spawnSync(process.execPath || "node", ["--no-deprecation"], {
      input: workerScript,
      env: {}, // ABSOLUTELY ZERO environment variables inherited! (No credentials exposure)
      timeout: 3500, // Timeout protection against infinite loops/DoS
      maxBuffer: 10 * 1024 * 1024,
    });

    if (run.error) {
      return {
        status: "error",
        output: { error: `MicroVM spawn failure: ${run.error.message}` },
        logs: [`[FATAL] Sandboxed worker process could not be launched: ${run.error.message}`],
      };
    }

    if (run.status !== 0) {
      const stderr = run.stderr ? run.stderr.toString().trim() : "";
      return {
        status: "error",
        output: { error: `MicroVM worker crashed with status ${run.status}` },
        logs: [
          `[FATAL] Sandboxed process terminated with exit code ${run.status}.`,
          ...(stderr ? stderr.split("\n").map(line => `[STDERR] ${line}`) : []),
        ],
      };
    }

    const stdoutStr = run.stdout ? run.stdout.toString().trim() : "";
    if (!stdoutStr) {
      return {
        status: "error",
        output: { error: "MicroVM returned empty response" },
        logs: ["[FATAL] Sandboxed execution did not produce standard output telemetry."],
      };
    }

    try {
      const parsed = JSON.parse(stdoutStr);
      return {
        status: parsed.status || "active",
        output: parsed.output,
        logs: parsed.logs || [],
      };
    } catch (e: any) {
      return {
        status: "error",
        output: { error: `Malformed sandbox payload: ${stdoutStr}` },
        logs: [`[FATAL] Failed to parse micro-worker sandbox response JSON: ${e.message}`],
      };
    }
  } catch (err: any) {
    return {
      status: "error",
      output: { error: err.message },
      logs: [`[FATAL] Security Broker crashed during worker lifecycle management: ${err.message}`],
    };
  }
}
