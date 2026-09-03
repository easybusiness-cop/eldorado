import { MemoryItem, MemoryRanking } from './ranking.ts';

export class MemoryRetrieval {
  private static storage: MemoryItem[] = [];

  public static addRecord(item: Omit<MemoryItem, 'id' | 'timestamp'>): MemoryItem {
    const record: MemoryItem = {
      ...item,
      id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.storage.push(record);
    return record;
  }

  public static search(query: string, scope?: MemoryItem['scope']): MemoryItem[] {
    let pool = this.storage;
    if (scope) {
      pool = pool.filter(item => item.scope === scope);
    }
    return MemoryRanking.rankMemories(pool, query);
  }

  public static getAllRecords(): MemoryItem[] {
    return this.storage;
  }
}
