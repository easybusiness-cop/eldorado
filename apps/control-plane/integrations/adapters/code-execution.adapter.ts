import { BaseAdapter, ToolExecutionContext, ToolExecutionContract } from "./base.adapter";
import { RiskLevel } from "../registry/integration.types";
import * as vm from "node:vm";
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Universal Code Execution Adapter
 * Open-source composition: uses Node.js built-in `vm` module for sandboxed execution.
 * Foundation for "build anything / run anything".
 */
export class CodeExecutionAdapter extends BaseAdapter {
  get provider(): string {
    return "code-execution";
  }

  async execute(context: ToolExecutionContext): Promise<ToolExecutionContract> {
    const start = Date.now();
    const { action, parameters, correlationId = randomUUID() } = context;

    try {
      switch (action) {
        case "run_javascript":
        case "run_typescript":
          return await this.runJs(parameters, start, correlationId);

        case "write_temp_file":
          return this.writeTempFile(parameters, start, correlationId);

        case "read_temp_file":
          return this.readTempFile(parameters, start, correlationId);

        case "list_temp_files":
          return this.listTempFiles(start, correlationId);

        default:
          throw new Error(`Unsupported code-execution action: ${action}`);
      }
    } catch (err: any) {
      return this.createResponse(
        false,
        action,
        null,
        err.message || String(err),
        Date.now() - start,
        correlationId,
        "HIGH"
      );
    }
  }

  private async runJs(
    parameters: Record<string, any>,
    start: number,
    correlationId: string
  ): Promise<ToolExecutionContract> {
    const code = parameters.code as string;
    const timeoutMs = Math.min(Number(parameters.timeoutMs) || 5000, 12000); // hard max 12s
    const allowConsole = parameters.allowConsole !== false;

    if (!code || typeof code !== "string") {
      throw new Error("Parameter 'code' (string) is required.");
    }
    if (code.length > 100_000) {
      throw new Error("Code exceeds maximum allowed size (100KB).");
    }

    // Extremely restricted sandbox
    const sandbox: Record<string, any> = {
      __logs: [] as string[],
      __result: undefined as any,
      Math,
      JSON,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      undefined,
      null: null,
    };

    if (allowConsole) {
      sandbox.console = {
        log: (...args: any[]) => sandbox.__logs.push(args.map(String).join(" ")),
        error: (...args: any[]) => sandbox.__logs.push("[error] " + args.map(String).join(" ")),
        warn: (...args: any[]) => sandbox.__logs.push("[warn] " + args.map(String).join(" ")),
        info: (...args: any[]) => sandbox.__logs.push("[info] " + args.map(String).join(" ")),
      };
    }

    const wrapped = `
      "use strict";
      (function() {
        ${code}
      })();
    `;

    const script = new vm.Script(wrapped, {
      filename: "rufflo-sandbox.js",
    });

    const context = vm.createContext(sandbox);

    let result: any;
    try {
      result = script.runInContext(context, {
        timeout: timeoutMs,
        displayErrors: true,
      });
    } catch (e: any) {
      throw new Error(`Sandbox execution failed: ${e.message}`);
    }

    return this.createResponse(
      true,
      "run_javascript",
      {
        result: sandbox.__result !== undefined ? sandbox.__result : result,
        logs: sandbox.__logs,
        executionTimeMs: Date.now() - start,
      },
      null,
      Date.now() - start,
      correlationId,
      "MEDIUM"
    );
  }

  private getSandboxDir(): string {
    const dir = path.join(process.cwd(), ".rufflo-sandbox");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private writeTempFile(
    parameters: Record<string, any>,
    start: number,
    correlationId: string
  ): ToolExecutionContract {
    const content = parameters.content as string;
    const filename = (parameters.filename as string) || `temp-${randomUUID()}.txt`;

    if (content === undefined || content === null) {
      throw new Error("Parameter 'content' is required.");
    }

    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!safeName) throw new Error("Invalid filename.");

    const fullPath = path.join(this.getSandboxDir(), safeName);
    fs.writeFileSync(fullPath, String(content), "utf8");

    return this.createResponse(
      true,
      "write_temp_file",
      { path: fullPath, filename: safeName, bytes: Buffer.byteLength(String(content)) },
      null,
      Date.now() - start,
      correlationId,
      "LOW"
    );
  }

  private readTempFile(
    parameters: Record<string, any>,
    start: number,
    correlationId: string
  ): ToolExecutionContract {
    const filename = parameters.filename as string;
    if (!filename) throw new Error("Parameter 'filename' is required.");

    const safeName = path.basename(filename);
    const fullPath = path.join(this.getSandboxDir(), safeName);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found in sandbox: ${safeName}`);
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return this.createResponse(
      true,
      "read_temp_file",
      { path: fullPath, filename: safeName, content },
      null,
      Date.now() - start,
      correlationId,
      "LOW"
    );
  }

  private listTempFiles(start: number, correlationId: string): ToolExecutionContract {
    const dir = this.getSandboxDir();
    const files = fs.readdirSync(dir).map((name) => {
      const stat = fs.statSync(path.join(dir, name));
      return { name, size: stat.size, modified: stat.mtime.toISOString() };
    });

    return this.createResponse(
      true,
      "list_temp_files",
      { files },
      null,
      Date.now() - start,
      correlationId,
      "LOW"
    );
  }
}
