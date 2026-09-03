import { messageBus } from './message-bus.ts';

export class HandoffService {
  public static handoffContext(fromAgent: string, toAgent: string, payload: any): void {
    messageBus.publish({
      senderId: fromAgent,
      recipientId: toAgent,
      topic: 'AGENT_HANDOFF',
      payload: {
        previousAgent: fromAgent,
        workspaceSnapshot: payload,
        transferredAt: new Date().toISOString(),
      },
    });
  }
}
