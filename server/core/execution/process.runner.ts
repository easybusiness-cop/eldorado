import { spawn } from "node:child_process";

export interface ProcessRequest {
  command: string;
  cwd: string;
  timeoutMs: number;
  env?: Record<string, string>;
}

export interface ProcessResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  durationMs: number;
}

export class ProcessRunner {
  static run(request: ProcessRequest): Promise<ProcessResult> {
    return new Promise((resolve) => {
      const started = Date.now();

      const child = spawn("/bin/sh", ["-lc", request.command], {
        cwd: request.cwd,
        env: {
          ...process.env,
          ...request.env,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      child.stdout.on("data", (data) => {
        stdout += data.toString();
        // Prevent unbounded memory growth
        if (stdout.length > 2_000_000) {
          stdout = stdout.slice(-2_000_000);
        }
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
        if (stderr.length > 2_000_000) {
          stderr = stderr.slice(-2_000_000);
        }
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, request.timeoutMs);

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        resolve({
          exitCode,
          stdout,
          stderr,
          timedOut,
          durationMs: Date.now() - started,
        });
      });
    });
  }
}
