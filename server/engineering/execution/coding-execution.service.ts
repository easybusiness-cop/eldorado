import {
  CodingExecutionError,
  type CodingEngineAdapter,
  type CodingEngineHealth,
  type CodingEngineId,
  type CodingTaskRequest,
  type CodingTaskResult,
} from "./types.ts";
import { createOpenHandsAdapterFromEnv } from "./openhands.adapter.ts";
import { createOpenCodeAdapterFromEnv } from "./opencode.adapter.ts";
import {
  makeTaskResult,
  runtimeFailureCode,
  safeRuntimeError,
  validateTask,
} from "./runtime-utils.ts";
import { normalizeWorkspaceClaimKey } from "./workspace-guard.ts";

const ENGINE_IDS: CodingEngineId[] = ["openhands", "opencode"];

/**
 * Rufflo control-plane facade. The caller selects exactly one engine per task;
 * this service never retries a task on another runtime.
 */
export class CodingExecutionService {
  private readonly adapters: Map<CodingEngineId, CodingEngineAdapter>;
  private readonly activeWorkspaces = new Map<string, symbol>();
  private readonly activeTasks = new Map<string, symbol>();

  constructor(
    adapters: CodingEngineAdapter[] = [],
    private readonly configurationErrors: Partial<Record<CodingEngineId, string>> = {},
  ) {
    this.adapters = new Map();
    for (const adapter of adapters) {
      if (this.adapters.has(adapter.engine)) {
        throw new Error(`Only one adapter may be registered for ${adapter.engine}.`);
      }
      this.adapters.set(adapter.engine, adapter);
    }
  }

  async health(): Promise<CodingEngineHealth[]> {
    return Promise.all(
      ENGINE_IDS.map(async (engine) => {
        const adapter = this.adapters.get(engine);
        if (!adapter) {
          return {
            engine,
            configured: false,
            available: false,
            detail: this.configurationErrors[engine] ?? "The coding engine is not configured.",
          };
        }
        return adapter.health();
      }),
    );
  }

  async execute(task: CodingTaskRequest, engine: CodingEngineId): Promise<CodingTaskResult> {
    if (!ENGINE_IDS.includes(engine)) {
      return makeTaskResult(task, "opencode", {
        status: "failed",
        summary: "Rufflo received an unsupported coding engine selection.",
        errorCode: "INVALID_TASK",
        error: "Select either openhands or opencode.",
      });
    }

    const adapter = this.adapters.get(engine);
    if (!adapter) {
      return makeTaskResult(task, engine, {
        status: "failed",
        summary: "The requested coding engine is not configured.",
        errorCode: "ENGINE_NOT_CONFIGURED",
        error: this.configurationErrors[engine] ?? "Configure the runtime URL, authentication, and workspace root.",
      });
    }

    let taskKey: string | undefined;
    let workspaceKey: string | undefined;
    let lease: symbol | undefined;
    try {
      validateTask(task);
      taskKey = `${task.organizationId}:${task.taskId}`;
      workspaceKey = normalizeWorkspaceClaimKey(task.workspacePath);

      if (this.activeTasks.has(taskKey)) {
        throw new CodingExecutionError("WORKSPACE_BUSY", "This organization/task already has an active coding run.");
      }
      const workspaceOwner = this.activeWorkspaces.get(workspaceKey);
      if (workspaceOwner) {
        throw new CodingExecutionError(
          "WORKSPACE_BUSY",
          "The requested workspace is already claimed by an active task.",
        );
      }

      lease = Symbol(taskKey);
      this.activeTasks.set(taskKey, lease);
      this.activeWorkspaces.set(workspaceKey, lease);
      return await adapter.execute(task);
    } catch (error) {
      return makeTaskResult(task, engine, {
        status: "failed",
        summary: "Rufflo could not start the requested coding task.",
        errorCode: error instanceof CodingExecutionError ? error.code : runtimeFailureCode(error),
        error: safeRuntimeError(error),
      });
    } finally {
      if (lease && taskKey && this.activeTasks.get(taskKey) === lease) this.activeTasks.delete(taskKey);
      if (lease && workspaceKey && this.activeWorkspaces.get(workspaceKey) === lease) {
        this.activeWorkspaces.delete(workspaceKey);
      }
    }
  }
}

/** Build a service with whichever authenticated runtimes are fully configured. */
export function createCodingExecutionServiceFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): CodingExecutionService {
  const adapters: CodingEngineAdapter[] = [];
  const configurationErrors: Partial<Record<CodingEngineId, string>> = {};

  try {
    const adapter = createOpenHandsAdapterFromEnv(env);
    if (adapter) adapters.push(adapter);
  } catch (error) {
    configurationErrors.openhands = safeRuntimeError(error);
  }

  try {
    const adapter = createOpenCodeAdapterFromEnv(env);
    if (adapter) adapters.push(adapter);
  } catch (error) {
    configurationErrors.opencode = safeRuntimeError(error);
  }

  return new CodingExecutionService(adapters, configurationErrors);
}
