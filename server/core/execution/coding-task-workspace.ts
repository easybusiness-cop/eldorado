import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { CodingEngineId } from "../../engineering/execution/types.ts";

const execFileAsync = promisify(execFile);

export interface CodingTaskWorkspace {
  /** Path used by Rufflo itself for the isolated checkout. */
  localPath: string;
  /** Path that the selected coding runtime sees through its task volume. */
  runtimePath: string;
  cleanup(): Promise<void>;
}

/**
 * Creates a disposable, independent clone for one organization/task pair.
 * The clone has no Git remote, so a coding runtime can return a patch but
 * cannot push changes back to Rufflo's source repository.
 */
export class CodingTaskWorkspaceManager {
  async create(input: {
    organizationId: string;
    taskId: string;
    engine: CodingEngineId;
    env?: NodeJS.ProcessEnv;
  }): Promise<CodingTaskWorkspace> {
    const env = input.env ?? process.env;
    const workspace = this.resolveWorkspacePaths(input.engine, input.taskId, env);
    const repositoryRoot = await this.resolveRepositoryRoot(env);
    const workspaceRoot = await this.ensureRoot(workspace.localRoot);
    const organizationSegment = createHash("sha256").update(input.organizationId).digest("hex").slice(0, 32);
    const localPath = path.join(workspaceRoot, organizationSegment, input.taskId);
    const runtimePath = workspace.runtimePathFor(organizationSegment, input.taskId);

    await fs.mkdir(path.dirname(localPath), { recursive: true, mode: 0o700 });
    const realParent = await fs.realpath(path.dirname(localPath));
    if (!this.isInside(workspaceRoot, realParent)) {
      throw new Error("Coding workspace parent escaped the configured root.");
    }

    try {
      await execFileAsync(
        "git",
        ["clone", "--local", "--no-hardlinks", "--no-checkout", repositoryRoot, localPath],
        { windowsHide: true, timeout: 60_000, maxBuffer: 2 * 1024 * 1024 },
      );
      await execFileAsync("git", ["checkout", "--detach", "HEAD"], {
        cwd: localPath,
        windowsHide: true,
        timeout: 30_000,
        maxBuffer: 1024 * 1024,
      });
      await execFileAsync("git", ["remote", "remove", "origin"], {
        cwd: localPath,
        windowsHide: true,
        timeout: 10_000,
        maxBuffer: 1024 * 1024,
      });

      const realWorkspace = await fs.realpath(localPath);
      if (!this.isInside(workspaceRoot, realWorkspace)) {
        throw new Error("Coding workspace escaped the configured root.");
      }
    } catch (error) {
      await fs.rm(localPath, { recursive: true, force: true }).catch(() => undefined);
      throw new Error("Rufflo could not create an isolated Git workspace for the coding task.", { cause: error });
    }

    return {
      localPath,
      runtimePath,
      cleanup: async () => {
        const realWorkspace = await fs.realpath(localPath).catch(() => null);
        if (realWorkspace && !this.isInside(workspaceRoot, realWorkspace)) {
          throw new Error("Refusing to remove a coding workspace outside its configured root.");
        }
        await fs.rm(localPath, { recursive: true, force: true });
      },
    };
  }

  private resolveWorkspacePaths(
    engine: CodingEngineId,
    taskId: string,
    env: NodeJS.ProcessEnv,
  ): {
    localRoot: string;
    runtimePathFor(orgSegment: string, taskId: string): string;
  } {
    if (!/^[a-zA-Z0-9._-]{1,128}$/.test(taskId) || taskId === "." || taskId === "..") {
      throw new Error("Coding task ID is not a safe path segment.");
    }

    if (engine === "openhands") {
      const localRoot = env.OPENHANDS_WORKSPACE_HOST_ROOT?.trim();
      const runtimeRoot = env.OPENHANDS_WORKSPACE_ROOT?.trim();
      if (!localRoot || !runtimeRoot || !path.isAbsolute(localRoot) || !path.posix.isAbsolute(runtimeRoot)) {
        throw new Error(
          "OpenHands tasks require absolute OPENHANDS_WORKSPACE_HOST_ROOT and OPENHANDS_WORKSPACE_ROOT paths mapped to the same task volume.",
        );
      }
      return {
        localRoot: path.resolve(localRoot),
        runtimePathFor: (org, task) => path.posix.join(runtimeRoot, org, task),
      };
    }

    const root = env.OPENCODE_WORKSPACE_ROOT?.trim();
    if (!root || !path.isAbsolute(root)) {
      throw new Error("OpenCode tasks require an absolute OPENCODE_WORKSPACE_ROOT shared with the OpenCode server.");
    }
    return {
      localRoot: path.resolve(root),
      runtimePathFor: (_org, _task) => "/workspace",
    };
  }

  private async resolveRepositoryRoot(env: NodeJS.ProcessEnv): Promise<string> {
    const configured = env.RUFFLO_CODING_REPOSITORY_ROOT?.trim();
    const workingDirectory = configured ? path.resolve(configured) : process.cwd();
    try {
      const { stdout } = await execFileAsync("git", ["rev-parse", "--show-toplevel"], {
        cwd: workingDirectory,
        windowsHide: true,
        timeout: 10_000,
        maxBuffer: 64 * 1024,
      });
      const repositoryRoot = path.resolve(stdout.trim());
      const realRoot = await fs.realpath(repositoryRoot);
      return realRoot;
    } catch (error) {
      throw new Error("RUFFLO_CODING_REPOSITORY_ROOT must point inside a Git repository.", { cause: error });
    }
  }

  private async ensureRoot(root: string): Promise<string> {
    await fs.mkdir(root, { recursive: true, mode: 0o700 });
    const realRoot = await fs.realpath(root);
    const rootInfo = await fs.stat(realRoot);
    if (!rootInfo.isDirectory()) throw new Error("Coding workspace root must be a directory.");
    return realRoot;
  }

  private isInside(root: string, candidate: string): boolean {
    const relative = path.relative(root, candidate);
    return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  }
}

export const codingTaskWorkspaceManager = new CodingTaskWorkspaceManager();
