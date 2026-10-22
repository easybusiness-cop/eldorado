import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { CodingExecutionError, type CodingExecutionErrorCode } from "./types.ts";

const SAFE_SCOPE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

export type WorkspacePathFlavor = "native" | "posix" | "win32";

function pathApi(flavor: WorkspacePathFlavor) {
  if (flavor === "posix") return path.posix;
  if (flavor === "win32") return path.win32;
  return path;
}

function normalizeForComparison(value: string, flavor: WorkspacePathFlavor): string {
  const api = pathApi(flavor);
  const normalized = api.normalize(value);
  return ((flavor === "native" && process.platform === "win32") || flavor === "win32")
    ? normalized.toLocaleLowerCase("en-US")
    : normalized;
}

export function isSafeScopeId(value: string): boolean {
  return SAFE_SCOPE_ID.test(value) && value !== "." && value !== "..";
}

/**
 * Enforces a strict organization/task directory layout. For remote OpenHands
 * workspaces this is a lexical check; the Agent Server must additionally be
 * deployed with a sandbox/mount that exposes only the task directory.
 */
export function assertTaskWorkspaceScope(input: {
  workspacePath: string;
  workspaceRoot: string;
  organizationId: string;
  taskId: string;
  flavor: WorkspacePathFlavor;
}): string {
  const { workspacePath, workspaceRoot, organizationId, taskId, flavor } = input;
  const api = pathApi(flavor);

  if (!isSafeScopeId(organizationId) || !isSafeScopeId(taskId)) {
    throw new CodingExecutionError(
      "WORKSPACE_OUT_OF_SCOPE",
      "Organization and task identifiers must be safe single path segments.",
    );
  }

  if (!api.isAbsolute(workspacePath) || !api.isAbsolute(workspaceRoot)) {
    throw new CodingExecutionError(
      "WORKSPACE_OUT_OF_SCOPE",
      "The workspace and allowed workspace root must be absolute paths.",
    );
  }

  const expected = api.resolve(workspaceRoot, organizationId, taskId);
  const supplied = api.resolve(workspacePath);
  if (normalizeForComparison(expected, flavor) !== normalizeForComparison(supplied, flavor)) {
    throw new CodingExecutionError(
      "WORKSPACE_OUT_OF_SCOPE",
      "The task workspace must be the dedicated organization/task workspace.",
    );
  }

  return expected;
}

/** Local OpenCode runs verify actual paths and reject symlink redirection. */
export async function assertLocalWorkspaceReady(
  workspacePath: string,
  workspaceRoot: string,
): Promise<string> {
  try {
    const [realRoot, realWorkspace, rootStat, workspaceStat] = await Promise.all([
      realpath(workspaceRoot),
      realpath(workspacePath),
      stat(workspaceRoot),
      stat(workspacePath),
    ]);

    if (!rootStat.isDirectory() || !workspaceStat.isDirectory()) {
      throw new Error("not a directory");
    }

    if (path.resolve(realWorkspace) !== path.resolve(workspacePath)) {
      throw new CodingExecutionError(
        "WORKSPACE_OUT_OF_SCOPE",
        "The task workspace resolves through a symlink and is not accepted.",
      );
    }

    const relative = path.relative(realRoot, realWorkspace);
    if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new CodingExecutionError(
        "WORKSPACE_OUT_OF_SCOPE",
        "The task workspace must be a child of its configured root.",
      );
    }

    return realWorkspace;
  } catch (error) {
    if (error instanceof CodingExecutionError) throw error;
    throw new CodingExecutionError(
      "WORKSPACE_NOT_READY",
      "The dedicated task workspace must exist and be a readable directory.",
      { cause: error },
    );
  }
}

export function normalizeWorkspaceClaimKey(workspacePath: string): string {
  if (path.win32.isAbsolute(workspacePath)) {
    return path.win32.normalize(workspacePath).toLocaleLowerCase("en-US");
  }
  return path.posix.normalize(workspacePath);
}

export function asWorkspaceErrorCode(error: unknown): CodingExecutionErrorCode | undefined {
  return error instanceof CodingExecutionError ? error.code : undefined;
}
