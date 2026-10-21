export type WorkflowStatus = 'PENDING' | 'PLANNING' | 'RUNNING' | 'WAITING_APPROVAL' | 'VERIFYING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

export interface WorkflowState {
  workflowId: string;
  status: WorkflowStatus;
  currentStepIndex: number;
  steps: {
    name: string;
    description: string;
    assignedAgent: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
    result?: any;
    error?: string;
  }[];
  context: Record<string, any>;
  errors: string[];
}
