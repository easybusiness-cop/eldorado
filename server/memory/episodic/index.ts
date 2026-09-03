import { MemoryRetrieval } from '../retrieval.ts';
import { MemoryPolicy } from '../memory-policy.ts';

export class EpisodicMemory {
  public static logEvent(agentId: string, event: string): void {
    const cleanEvent = MemoryPolicy.sanitizeContent(event);
    MemoryRetrieval.addRecord({
      scope: 'episodic',
      content: `[Agent ${agentId} Event] ${cleanEvent}`,
      tags: [agentId, 'event'],
    });
  }
}
