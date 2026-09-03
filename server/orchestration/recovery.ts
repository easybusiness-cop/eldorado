import { WorkflowState } from './graph/state.ts';
import { WorkflowCheckpointer } from './graph/checkpoint.ts';

export class RecoveryEngine {
  public static attemptRecovery(state: WorkflowState, failingStepName: string, error: string): {
    state: WorkflowState;
    actionTaken: string;
  } {
    state.errors.push(`Failure in step "${failingStepName}": ${error}`);

    // Try rollback from checkpoints
    const restored = WorkflowCheckpointer.rollbackToLastValid(state.workflowId);
    if (restored) {
      restored.errors.push(`Restored state from safe checkpoint after failure in "${failingStepName}"`);
      return {
        state: restored,
        actionTaken: 'ROLLBACK_TO_CHECKPOINT',
      };
    }

    // Otherwise, perform in-place fallback retry
    const step = state.steps.find(s => s.name === failingStepName);
    if (step) {
      step.status = 'pending'; // Reset step status for execution retry
      return {
        state,
        actionTaken: 'RESET_STEP_TO_PENDING_FOR_RETRY',
      };
    }

    state.status = 'FAILED';
    return {
      state,
      actionTaken: 'MARK_WORKFLOW_FAILED',
    };
  }
}
