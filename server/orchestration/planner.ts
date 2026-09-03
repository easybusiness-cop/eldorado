import { WorkflowState } from './graph/state.ts';

export class Planner {
  public static createDecomposition(goal: string): WorkflowState['steps'] {
    return [
      { name: 'Research specifications', description: `Extract requirements for ${goal}`, assignedAgent: 'researcher', status: 'pending' },
      { name: 'Develop implementationSpec', description: 'Compile architectural designs', assignedAgent: 'product_manager', status: 'pending' },
      { name: 'Apply modifications', description: 'Write files and build target pipeline', assignedAgent: 'engineer', status: 'pending' },
    ];
  }
}
