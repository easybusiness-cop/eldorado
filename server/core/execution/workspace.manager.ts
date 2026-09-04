import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(
  process.env.RUFFLO_WORKSPACE_ROOT ??
    path.join(process.cwd(), ".rufflo-workspaces")
);

export class WorkspaceManager {
  static async initialize() {
    await fs.mkdir(ROOT, {
      recursive: true,
      mode: 0o700,
    });
  }

  static async create(taskId: string): Promise<string> {
    await this.initialize();

    const safeTaskId = taskId.replace(/[^a-zA-Z0-9_-]/g, "_");

    const workspace = path.join(
      ROOT,
      `${safeTaskId}-${crypto.randomUUID()}`
    );

    await fs.mkdir(workspace, {
      recursive: true,
      mode: 0o700,
    });

    return workspace;
  }

  static async exists(workspace: string) {
    try {
      await fs.access(workspace);
      return true;
    } catch {
      return false;
    }
  }

  static async destroy(workspace: string) {
    if (!workspace.startsWith(ROOT)) {
      throw new Error(
        "Workspace deletion outside Rufflo workspace root is forbidden."
      );
    }

    await fs.rm(workspace, {
      recursive: true,
      force: true,
    });
  }
}
