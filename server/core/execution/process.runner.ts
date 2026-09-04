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

const MAX_OUTPUT_BYTES = 2_000_000;

const BLOCKED_ENV_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GITHUB_TOKEN",
  "GH_TOKEN",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "DATABASE_URL",
  "POSTGRES_URL",
  "REDIS_URL",
  "VAULT_TOKEN",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_SESSION_TOKEN",
];

function buildExecutionEnvironment(
  requested?: Record<string, string>,
): Record<string, string> {
  /*
   * Do NOT inherit process.env.
   *
   * The autonomous worker receives only a small,
   * explicitly approved environment.
   */
  const base: Record<string, string> = {
    PATH:
      process.env.PATH ??
      "/usr/local/bin:/usr/bin:/bin",

    HOME:
      "/tmp/rufflo-home",

    LANG:
      "C.UTF-8",

    LC_ALL:
      "C.UTF-8",

    NODE_ENV:
      "sandbox",
  };

  if (!requested) {
    return base;
  }

  for (
    const [key, value]
    of Object.entries(requested)
  ) {
    if (
      BLOCKED_ENV_KEYS.includes(
        key.toUpperCase(),
      )
    ) {
      continue;
    }

    /*
     * Never allow callers to override these
     * isolation-related variables.
     */
    if (
      key === "NODE_ENV" ||
      key === "HOME" ||
      key === "PATH"
    ) {
      continue;
    }

    if (
      typeof value === "string" &&
      value.length <= 4096
    ) {
      base[key] = value;
    }
  }

  return base;
}

function appendLimited(
  current: string,
  incoming: string,
): string {
  const next =
    current + incoming;

  if (
    next.length <=
    MAX_OUTPUT_BYTES
  ) {
    return next;
  }

  return next.slice(
    -MAX_OUTPUT_BYTES,
  );
}

export class ProcessRunner {
  static run(
    request: ProcessRequest,
  ): Promise<ProcessResult> {
    return new Promise(
      (resolve) => {
        const started =
          Date.now();

        const timeoutMs =
          Math.max(
            1_000,
            Math.min(
              request.timeoutMs,
              600_000,
            ),
          );

        const child =
          spawn(
            "/bin/sh",
            [
              "-lc",
              request.command,
            ],
            {
              cwd: request.cwd,

              /*
               * SECURITY:
               * Never inherit the parent process
               * environment.
               */
              env:
                buildExecutionEnvironment(
                  request.env,
                ),

              stdio: [
                "ignore",
                "pipe",
                "pipe",
              ],

              /*
               * Detached allows us to terminate the
               * process group when supported.
               */
              detached: true,
            },
          );

        let stdout = "";
        let stderr = "";
        let timedOut = false;
        let settled = false;

        const finish = (
          exitCode: number | null,
        ) => {
          if (settled) {
            return;
          }

          settled = true;

          resolve({
            exitCode,
            stdout,
            stderr,
            timedOut,
            durationMs:
              Date.now() -
              started,
          });
        };

        child.stdout.on(
          "data",
          (data: Buffer) => {
            stdout =
              appendLimited(
                stdout,
                data.toString(),
              );
          },
        );

        child.stderr.on(
          "data",
          (data: Buffer) => {
            stderr =
              appendLimited(
                stderr,
                data.toString(),
              );
          },
        );

        const timer =
          setTimeout(() => {
            timedOut = true;

            /*
             * Kill the process group instead of
             * only the shell process.
             */
            try {
              if (
                child.pid
              ) {
                process.kill(
                  -child.pid,
                  "SIGKILL",
                );
              } else {
                child.kill(
                  "SIGKILL",
                );
              }
            } catch {
              try {
                child.kill(
                  "SIGKILL",
                );
              } catch {
                // Process may already have exited.
              }
            }
          }, timeoutMs);

        child.on(
          "error",
          (error) => {
            clearTimeout(timer);

            stderr =
              appendLimited(
                stderr,
                error.message,
              );

            finish(null);
          },
        );

        child.on(
          "close",
          (exitCode) => {
            clearTimeout(timer);
            finish(exitCode);
          },
        );
      },
    );
  }
}
