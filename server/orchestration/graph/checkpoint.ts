import { WorkflowState } from './state.ts';

export class WorkflowCheckpointer {
  private static checkpoints: Record<string, WorkflowState[]> = {};

  public static checkpoint(state: WorkflowState): void {
    if (!this.checkpoints[state.workflowId]) {
      this.checkpoints[state.workflowId] = [];
    }
    // Deep clone state snapshot
    this.checkpoints[state.workflowId].push(JSON.parse(JSON.stringify(state)));
  }

  public static getHistory(workflowId: string): WorkflowState[] {
    return this.checkpoints[workflowId] || [];
  }

  public static rollbackToLastValid(workflowId: string): WorkflowState | null {
    const history = this.checkpoints[workflowId];
    if (history && history.length > 1) {
      // Return second to last checkpoint
      return history[history.length - 2];
    }
    return null;
  }
}
