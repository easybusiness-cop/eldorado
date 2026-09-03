import { WorkflowState } from './state.ts';

export class WorkflowEdges {
  public static routeNext(state: WorkflowState): 'execute_step' | 'wait_approval' | 'verify' | 'completed' {
    if (state.status === 'PLANNING') {
      return 'execute_step';
    }

    if (state.status === 'RUNNING') {
      // Check if any step requires approval (e.g. high-risk actions)
      const currentStep = state.steps[state.currentStepIndex];
      if (currentStep?.assignedAgent === 'engineer' && state.context.highRisk) {
        state.status = 'WAITING_APPROVAL';
        return 'wait_approval';
      }

      if (state.currentStepIndex < state.steps.length - 1) {
        state.currentStepIndex++;
        return 'execute_step';
      }

      return 'verify';
    }

    return 'completed';
  }
}
