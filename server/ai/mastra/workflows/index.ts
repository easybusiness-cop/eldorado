import { StatefulWorkflow, WorkflowStep } from '../../../../shared/types/index.ts';

export interface WorkflowDefinition {
  id: string;
  name: string;
  department: StatefulWorkflow['department'];
  description: string;
  steps: Array<{
    name: string;
    agentId: string;
    tool?: string;
    requiresApproval?: boolean;
  }>;
}

export class MastraWorkflowEngine {
  private static instance: MastraWorkflowEngine;
  private activeWorkflows: Map<string, StatefulWorkflow> = new Map();

  private constructor() {}

  public static getInstance(): MastraWorkflowEngine {
    if (!MastraWorkflowEngine.instance) {
      MastraWorkflowEngine.instance = new MastraWorkflowEngine();
    }
    return MastraWorkflowEngine.instance;
  }

  public createWorkflow(def: WorkflowDefinition, initialState: Record<string, any> = {}): StatefulWorkflow {
    const steps: WorkflowStep[] = def.steps.map((s, idx) => ({
      id: `step-${Date.now()}-${idx}`,
      name: s.name,
      assignedAgentId: s.agentId,
      tool: s.tool,
      requiresApproval: s.requiresApproval || false,
      status: 'pending',
    }));

    const wf: StatefulWorkflow = {
      id: `wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: def.name,
      department: def.department,
      description: def.description,
      steps,
      currentStepIndex: 0,
      status: 'pending',
      state: initialState,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.activeWorkflows.set(wf.id, wf);
    return wf;
  }

  public getWorkflow(id: string): StatefulWorkflow | undefined {
    return this.activeWorkflows.get(id);
  }

  public getAllWorkflows(): StatefulWorkflow[] {
    return Array.from(this.activeWorkflows.values());
  }

  public advanceWorkflow(id: string, stepOutput?: any): StatefulWorkflow | undefined {
    const wf = this.activeWorkflows.get(id);
    if (!wf || wf.status === 'completed' || wf.status === 'failed') {
      return wf;
    }

    const currentStep = wf.steps[wf.currentStepIndex];
    if (currentStep) {
      currentStep.status = 'completed';
      currentStep.output = stepOutput;
    }

    if (wf.currentStepIndex + 1 < wf.steps.length) {
      wf.currentStepIndex += 1;
      const nextStep = wf.steps[wf.currentStepIndex];
      nextStep.status = nextStep.requiresApproval ? 'awaiting_approval' : 'running';
      wf.status = nextStep.requiresApproval ? 'paused' : 'running';
    } else {
      wf.status = 'completed';
    }

    wf.updatedAt = Date.now();
    return wf;
  }
}

export const mastraWorkflowEngine = MastraWorkflowEngine.getInstance();
