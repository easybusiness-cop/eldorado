export interface TaskSchema {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  assignedAgentId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresHumanApproval?: boolean;
}

export function validateTaskPayload(payload: any): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Task payload must be an object' };
  }
  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length === 0) {
    return { valid: false, error: 'Task title is required' };
  }
  return { valid: true };
}

export function validateToolExecutionPayload(payload: any): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Execution payload must be an object' };
  }
  if (!payload.toolName) {
    return { valid: false, error: 'toolName is required' };
  }
  if (!payload.agentId) {
    return { valid: false, error: 'agentId is required' };
  }
  return { valid: true };
}
