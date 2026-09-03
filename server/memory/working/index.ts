import { MemoryRetrieval } from '../retrieval.ts';
import { MemoryPolicy } from '../memory-policy.ts';

export class WorkingMemory {
  public static saveState(key: string, value: any): void {
    const cleanContent = MemoryPolicy.sanitizeContent(JSON.stringify(value));
    MemoryRetrieval.addRecord({
      scope: 'working',
      content: `State Snapshot for key [${key}]: ${cleanContent}`,
      tags: [key, 'state'],
    });
  }

  public static loadState(key: string): string | null {
    const results = MemoryRetrieval.search(key, 'working');
    if (results.length > 0) {
      return results[0].content;
    }
    return null;
  }
}
