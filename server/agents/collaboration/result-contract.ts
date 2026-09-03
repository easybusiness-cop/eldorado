import { TaskContract } from './task-contract.ts';

export interface ResultContract {
  taskId: string;
  assigneeId: string;
  success: boolean;
  artifacts: { name: string; type: string; content: string }[];
  summary: string;
  verifiedBy?: string;
}
