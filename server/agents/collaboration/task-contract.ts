export interface TaskContract {
  taskId: string;
  creatorId: string;
  assigneeId: string;
  description: string;
  requirements: string[];
  dueDate?: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
}
