import { WorkflowState } from './state.ts';

export class WorkflowNodes {
  public static async executePlanning(state: WorkflowState): Promise<WorkflowState> {
    state.status = 'PLANNING';
    // Establish workflow steps
    state.steps = [
      { name: 'Research Target Requirements', description: 'Web research and discovery', assignedAgent: 'researcher', status: 'pending' },
      { name: 'Compile Architecture Spec', description: 'Design implementation structure', assignedAgent: 'product_manager', status: 'pending' },
      { name: 'Apply Code Implementation', description: 'Modify files and run builders', assignedAgent: 'engineer', status: 'pending' },
    ];
    state.currentStepIndex = 0;
    return state;
  }

  public static async executeStep(state: WorkflowState): Promise<WorkflowState> {
    state.status = 'RUNNING';
    const currentStep = state.steps[state.currentStepIndex];
    if (currentStep) {
      currentStep.status = 'running';
      currentStep.status = 'blocked';
      currentStep.error = `No execution adapter is configured for agent "${currentStep.assignedAgent}".`;
      state.errors.push(currentStep.error);
      state.status = 'BLOCKED';
    }
    return state;
  }

  public static async executeVerification(state: WorkflowState): Promise<WorkflowState> {
    state.status = 'VERIFYING';
    const hasFailures = state.steps.some(s => s.status === 'failed');
    const allStepsCompleted = state.steps.length > 0 && state.steps.every(s => s.status === 'completed');
    if (hasFailures) {
      state.status = 'FAILED';
    } else if (allStepsCompleted) {
      state.status = 'COMPLETED';
    } else {
      state.status = 'BLOCKED';
      state.errors.push('Workflow verification cannot pass until every step has execution evidence.');
    }
    return state;
  }
}
