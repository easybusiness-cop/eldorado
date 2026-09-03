import { mastraMemoryStore, MemoryRecord } from '../mastra/memory/index.ts';

export class MemoryAdapter {
  /**
   * Translates local memory store records to model messages or instructions.
   */
  public static getAdaptedContext(agentId: string, department: string, scopes: MemoryRecord['scope'][] = ['agent', 'department', 'company']): string {
    const contextLines: string[] = [];
    
    // 1. Retrieve agent memories
    if (scopes.includes('agent')) {
      const agentMemories = mastraMemoryStore.getMemories(agentId, 5);
      if (agentMemories.length > 0) {
        contextLines.push('### Agent Private Short-term Memories:');
        agentMemories.forEach(m => contextLines.push(`- [${new Date(m.timestamp).toLocaleDateString()}] ${m.content}`));
      }
    }

    // 2. Retrieve department memories
    if (scopes.includes('department') && department) {
      const deptMemories = mastraMemoryStore.getMemoriesByScope('department')
        .filter(m => m.tags.includes(department))
        .slice(0, 5);
      if (deptMemories.length > 0) {
        contextLines.push(`### Department memories (${department}):`);
        deptMemories.forEach(m => contextLines.push(`- ${m.content}`));
      }
    }

    // 3. Retrieve company/global memories
    if (scopes.includes('company')) {
      const companyMemories = mastraMemoryStore.getMemoriesByScope('company').slice(0, 5);
      if (companyMemories.length > 0) {
        contextLines.push('### Company-wide Context & Rules:');
        companyMemories.forEach(m => contextLines.push(`- ${m.content}`));
      }
    }

    return contextLines.join('\n');
  }

  /**
   * Persists a newly acquired memory in the corresponding memory scope.
   */
  public static persistMemory(agentId: string, department: string, content: string, scope: MemoryRecord['scope'] = 'agent', tags: string[] = []): MemoryRecord {
    const allTags = [...tags];
    if (department && !allTags.includes(department)) {
      allTags.push(department);
    }
    return mastraMemoryStore.saveMemory(agentId, content, scope, allTags);
  }
}
