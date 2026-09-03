import { WorkflowState } from './state.ts';
import { WorkflowNodes } from './nodes.ts';
import { WorkflowEdges } from './edges.ts';
import { WorkflowCheckpointer } from './checkpoint.ts';

export class GraphRunner {
  public static async runWorkflow(initialContext: Record<string, any>): Promise<WorkflowState> {
    let state: WorkflowState = {
      workflowId: `wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'PENDING',
      currentStepIndex: 0,
      steps: [],
      context: initialContext,
      errors: [],
    };

    WorkflowCheckpointer.checkpoint(state);

    // 1. Planning phase
    state = await WorkflowNodes.executePlanning(state);
    WorkflowCheckpointer.checkpoint(state);

    // 2. Loop Execution phase
    let iterations = 0;
    while (iterations < 20) {
      const nextNode = WorkflowEdges.routeNext(state);

      if (nextNode === 'wait_approval') {
        break; // Wait for administrative/risk policy reviews
      }

      if (nextNode === 'execute_step') {
        state = await WorkflowNodes.executeStep(state);
        WorkflowCheckpointer.checkpoint(state);
      } else if (nextNode === 'verify') {
        state = await WorkflowNodes.executeVerification(state);
        WorkflowCheckpointer.checkpoint(state);
        break;
      } else {
        break;
      }
      iterations++;
    }

    return state;
  }
}
