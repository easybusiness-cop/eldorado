import { mastraMemoryStore } from '../ai/mastra/memory/index.ts';

export class AgentMemoryService {
  public static save(agentId: string, fact: string, tags: string[] = []) {
    return mastraMemoryStore.saveMemory(agentId, fact, 'agent', tags);
  }

  public static get(agentId: string) {
    return mastraMemoryStore.getMemories(agentId);
  }

  public static quantumSearch(query: string, limit = 5, agentId?: string) {
    return mastraMemoryStore.quantumSearch(query, limit, agentId);
  }
}

export class CompanyMemoryService {
  public static save(title: string, summary: string, department: string) {
    return mastraMemoryStore.saveMemory('company', `[${department.toUpperCase()}] ${title}: ${summary}`, 'company', [department]);
  }

  public static getAll() {
    return mastraMemoryStore.getMemoriesByScope('company');
  }

  public static quantumSearch(query: string, limit = 5) {
    return mastraMemoryStore.quantumSearch(query, limit);
  }
}

export class ProjectMemoryService {
  public static save(projectId: string, note: string) {
    return mastraMemoryStore.saveMemory(projectId, note, 'project', [projectId]);
  }

  public static get(projectId: string) {
    return mastraMemoryStore.getMemories(projectId);
  }
}
