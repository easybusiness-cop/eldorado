export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'waiting'
  | 'blocked'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'offline';

export type DepartmentId =
  | 'executive'
  | 'engineering'
  | 'product'
  | 'design'
  | 'marketing'
  | 'sales'
  | 'finance'
  | 'hr'
  | 'legal'
  | 'operations'
  | 'customer_success'
  | 'infrastructure'
  | 'security'
  | 'research';

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  department: DepartmentId;
  systemInstructions: string;
  capabilities: string[];
  tools: string[];
  permissions: string[];
  managerId?: string;
  delegationRules?: string[];
  approvalRequirements?: string[];
  status: AgentStatus;
  currentTaskId?: string;
  metrics: {
    tasksCompleted: number;
    tokensProcessed: number;
    successRate: number;
    avgLatencyMs: number;
  };
}

export interface DepartmentDefinition {
  id: DepartmentId;
  name: string;
  managerId: string;
  agentIds: string[];
  budget: number;
  activeProjects: string[];
  pipelines: string[];
  policies: string[];
  knowledgeBaseSummary: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  assignedAgentId: string;
  tool?: string;
  requiresApproval?: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval';
  input?: any;
  output?: any;
  error?: string;
}

export interface StatefulWorkflow {
  id: string;
  name: string;
  department: DepartmentId;
  description: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  status: 'pending' | 'running' | 'completed' | 'paused' | 'failed';
  state: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface ToolExecutionRequest {
  toolName: string;
  agentId: string;
  departmentId: DepartmentId;
  organizationId: string;
  parameters: Record<string, any>;
  environment?: 'development' | 'staging' | 'production';
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  auditId: string;
  executionTimeMs: number;
}

export interface IntegrationConnectionStatus {
  id: string;
  name: string;
  provider: 'github' | 'gmail' | 'slack' | 'notion' | 'instagram' | 'youtube' | 'x' | 'linkedin' | 'custom';
  connected: boolean;
  authType: 'oauth' | 'token' | 'api_key';
  scopes: string[];
  lastSync?: string;
  accountEmailOrHandle?: string;
}
