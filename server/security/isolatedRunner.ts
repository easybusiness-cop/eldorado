import { spawnSync } from "child_process";

export interface IsolatedExecutionResult {
  status: "active" | "error";
  output: any;
  logs: string[];
}

/**
 * Executes dynamic system code in a restricted Node.js subprocess.
 *
 * IMPORTANT:
 * This is process-level isolation only.
 * It is NOT a MicroVM and must not be treated as
 * an OS-level security boundary.
 *
 * Production deployments should replace this runner
 * with a real container/VM/WASM isolation boundary.
 */
export function runInIsolatedProcess(
  code: string,
  context: any = {},
  hotPatchVersion: number = 1
): IsolatedExecutionResult {
  const serializedContext = JSON.stringify(context || {});

  // JavaScript wrapper payload sent to Node subprocess
  const workerScript = `const path = require('path');
const originalRequire = module.constructor.prototype.require;

const workspaceRoot = process.cwd();
function enforceWorkspaceBoundary(filePath) {
  if (!filePath) return;
  let strPath = "";
  if (typeof filePath === 'string') {
    strPath = filePath;
  } else if (filePath instanceof URL) {
    strPath = filePath.pathname;
  } else if (typeof filePath.toString === 'function') {
    strPath = filePath.toString();
  } else {
    return;
  }

  const resolvedPath = path.resolve(strPath);
  if (!resolvedPath.startsWith(workspaceRoot)) {
    throw new Error("Access denied: File path escapes the secure workspace boundary: " + resolvedPath);
  }

  const baseName = path.basename(resolvedPath);
  if (['.env', 'package-lock.json', 'firestore.rules', 'firebase-blueprint.json'].includes(baseName) || resolvedPath.includes('.git') || resolvedPath.includes('node_modules')) {
    throw new Error("Access denied: Reading or writing sensitive configuration or artifact is strictly forbidden inside sandbox.");
  }
}

function createFsProxy(originalFs) {
  return new Proxy(originalFs, {
    get(target, prop) {
      const originalVal = target[prop];
      if (typeof originalVal === 'function') {
        return function(...args) {
          if (args[0]) {
            enforceWorkspaceBoundary(args[0]);
          }
          return originalVal.apply(target, args);
        };
      }
      return originalVal;
    }
  });
}

// Intercept module require to block network/file access modules
module.constructor.prototype.require = function(id) {
  if (['http', 'https', 'net', 'dgram', 'dns', 'child_process', 'tls', 'cluster'].includes(id)) {
    throw new Error("Access denied: Module '" + id + "' is blocked within the Restricted Node Worker (Network/Process isolation).");
  }
  
  if (id === 'fs' || id === 'node:fs') {
    const originalFs = originalRequire.apply(this, [id]);
    return createFsProxy(originalFs);
  }

  if (id === 'fs/promises' || id === 'node:fs/promises') {
    const originalFsPromises = originalRequire.apply(this, [id]);
    return createFsProxy(originalFsPromises);
  }

  return originalRequire.apply(this, arguments);
};

// Intercept global fetch and other network helpers to enforce actual network isolation
const blockMessage = "Access denied: Host network access is blocked within the Restricted Node Worker.";
globalThis.fetch = () => Promise.reject(new Error(blockMessage));

if (globalThis.XMLHttpRequest) {
  globalThis.XMLHttpRequest = function() {
    throw new Error(blockMessage);
  };
}

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
        output: { error: `Restricted Node Worker spawn failure: ${run.error.message}` },
        logs: [`[FATAL] Sandboxed worker process could not be launched: ${run.error.message}`],
      };
    }

    if (run.status !== 0) {
      const stderr = run.stderr ? run.stderr.toString().trim() : "";
      return {
        status: "error",
        output: { error: `Restricted Node Worker crashed with status ${run.status}` },
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
        output: { error: "Restricted Node Worker returned empty response" },
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
