import { MemoryRetrieval } from '../retrieval.ts';

export class SemanticMemory {
  public static learnFact(fact: string, tags: string[] = []): void {
    MemoryRetrieval.addRecord({
      scope: 'semantic',
      content: fact,
      tags: [...tags, 'fact'],
    });
  }
}
