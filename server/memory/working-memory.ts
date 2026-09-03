export class WorkingMemory {
  private static instance: WorkingMemory;
  private contexts: Map<string, Record<string, any>> = new Map();

  private constructor() {}

  public static getInstance(): WorkingMemory {
    if (!WorkingMemory.instance) {
      WorkingMemory.instance = new WorkingMemory();
    }
    return WorkingMemory.instance;
  }

  public setContext(taskId: string, context: Record<string, any>) {
    this.contexts.set(taskId, { ...context, updated: Date.now() });
  }

  public getContext(taskId: string): Record<string, any> | undefined {
    return this.contexts.get(taskId);
  }

  public clearContext(taskId: string) {
    this.contexts.delete(taskId);
  }
}

export const workingMemory = WorkingMemory.getInstance();
