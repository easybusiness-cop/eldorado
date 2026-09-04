import {
  spawn,
} from "node:child_process";

export interface TerminalResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

const MAX_OUTPUT = 2_000_000;

const BLOCKED_COMMANDS = [
  /\bsudo\b/i,
  /\bsu\s+-?\s*root\b/i,
  /\brm\s+-rf\s+\/(?:\s|$)/i,
  /\bmkfs\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bpoweroff\b/i,
];

export class TerminalRunner {
  public static async runCommand(
    command: string,
    cwd = ".",
    timeoutMs = 120_000,
  ): Promise<TerminalResult> {
    if (!command?.trim()) {
      return {
        success: false,
        stdout: "",
        stderr: "Command is required.",
        exitCode: 1,
        timedOut: false,
      };
    }

    for (const pattern of BLOCKED_COMMANDS) {
      if (pattern.test(command)) {
        return {
          success: false,
          stdout: "",
          stderr:
            `Command blocked by terminal policy: ${pattern}`,
          exitCode: 126,
          timedOut: false,
        };
      }
    }

    return new Promise((resolve) => {
      const started = Date.now();

      /*
       * Keep shell execution centralized.
       * Higher-level production execution should normally use
       * ExecutionKernel instead of calling this class directly.
       */
      const child = spawn(
        "/bin/sh",
        ["-lc", command],
        {
          cwd,
          env: {
            PATH: process.env.PATH ?? "",
            HOME: process.env.HOME ?? "",
            NODE_ENV:
              process.env.NODE_ENV ?? "development",
          },
          stdio: [
            "ignore",
            "pipe",
            "pipe",
          ],
        },
      );

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const append =
        (
          current: string,
          chunk: Buffer,
        ) => {
          const next =
            current + chunk.toString();

          if (next.length <= MAX_OUTPUT) {
            return next;
          }

          return next.slice(
            next.length - MAX_OUTPUT,
          );
        };

      child.stdout.on(
        "data",
        (data: Buffer) => {
          stdout = append(
            stdout,
            data,
          );
        },
      );

      child.stderr.on(
        "data",
        (data: Buffer) => {
          stderr = append(
            stderr,
            data,
          );
        },
      );

      const timer =
        setTimeout(() => {
          timedOut = true;
          child.kill("SIGKILL");
        }, timeoutMs);

      child.on(
        "error",
        (error) => {
          clearTimeout(timer);

          resolve({
            success: false,
            stdout,
            stderr:
              stderr ||
              error.message,
            exitCode: 1,
            timedOut,
          });
        },
      );

      child.on(
        "close",
        (exitCode) => {
          clearTimeout(timer);

          resolve({
            success:
              exitCode === 0 &&
              !timedOut,
            stdout,
            stderr,
            exitCode:
              exitCode ?? 1,
            timedOut,
          });
        },
      );
    });
  }
}
