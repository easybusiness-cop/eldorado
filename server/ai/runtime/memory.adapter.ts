import { mastraMemoryStore, type MemoryRecord } from '../mastra/memory/index.ts';

export class MemoryAdapter {
  public static async getRelevantContext(
    agentId: string,
    department: string,
    query: string,
    organizationId = 'org-default',
  ): Promise<string> {
    const contextLines: string[] = [];
    const searchQuery = query.slice(0, 2_000);

    const [agentMemories, departmentMemories, companyMemories] = await Promise.all([
      mastraMemoryStore.searchMemories(searchQuery, {
        agentId,
        scope: 'agent',
        limit: 5,
        organizationId,
      }),
      department
        ? mastraMemoryStore.searchMemories(searchQuery, {
            scope: 'department',
            tag: department,
            limit: 10,
            organizationId,
          })
        : Promise.resolve([]),
      mastraMemoryStore.searchMemories(searchQuery, {
        scope: 'company',
        limit: 5,
        organizationId,
      }),
    ]);

    if (agentMemories.length > 0) {
      contextLines.push('### Relevant agent memories:');
      agentMemories.forEach(({ memory }) => contextLines.push(`- ${memory.content.slice(0, 1_000)}`));
    }

    if (department) {
      const deptMemories = departmentMemories.slice(0, 5);
      if (deptMemories.length > 0) {
        contextLines.push(`### Department memories (${department}):`);
        deptMemories.forEach(({ memory }) => contextLines.push(`- ${memory.content.slice(0, 1_000)}`));
      }
    }

    if (companyMemories.length > 0) {
      contextLines.push('### Company-wide Context & Rules:');
      companyMemories.forEach(({ memory }) => contextLines.push(`- ${memory.content.slice(0, 1_000)}`));
    }

    return contextLines.join('\n');
  }

  public static persistMemory(
    agentId: string,
    department: string,
    content: string,
    scope: MemoryRecord['scope'] = 'agent',
    tags: string[] = [],
    organizationId = 'org-default',
  ): Promise<MemoryRecord> {
    const allTags = [...tags];
    if (department && !allTags.includes(department)) {
      allTags.push(department);
    }
    return mastraMemoryStore.saveMemory(agentId, content, scope, allTags, organizationId);
  }
}
