import { TaskContract } from './task-contract.ts';
import { messageBus } from './message-bus.ts';

export class DelegationEngine {
  public static delegateTask(contract: TaskContract): void {
    // Publish delegation offer across the corporate MessageBus
    messageBus.publish({
      senderId: contract.creatorId,
      recipientId: contract.assigneeId,
      topic: 'TASK_DELEGATION',
      payload: contract,
    });
  }
}
