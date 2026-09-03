export type WorkflowStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "BLOCKED";

export interface WorkflowStep {
  id: string;
  name: string;
  tool: string;
  action: string;
  parameters: Record<string, any>;
  status: WorkflowStatus;
  output?: any;
  error?: string;
}

export interface BusinessWorkflow {
  id: string;
  name: string;
  departmentId: string;
  status: WorkflowStatus;
  currentStepIndex: number;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
  triggeredBy: string; // Employee ID or trigger event
}
