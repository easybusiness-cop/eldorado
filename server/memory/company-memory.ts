import { mastraMemoryStore } from '../ai/mastra/memory/index.ts';

export class AgentMemoryService {
  public static save(agentId: string, fact: string, tags: string[] = [], organizationId = 'org-default') {
    return mastraMemoryStore.saveMemory(agentId, fact, 'agent', tags, organizationId);
  }

  public static get(agentId: string, organizationId = 'org-default') {
    return mastraMemoryStore.getMemories(agentId, 10, organizationId);
  }

  public static search(query: string, limit = 5, agentId?: string, organizationId = 'org-default') {
    return mastraMemoryStore.searchMemories(query, { limit, agentId, organizationId });
  }
}

export class CompanyMemoryService {
  public static save(title: string, summary: string, department: string, organizationId = 'org-default') {
    return mastraMemoryStore.saveMemory('company', `[${department.toUpperCase()}] ${title}: ${summary}`, 'company', [department], organizationId);
  }

  public static getAll(organizationId = 'org-default') {
    return mastraMemoryStore.getMemoriesByScope('company', organizationId);
  }

  public static search(query: string, limit = 5, organizationId = 'org-default') {
    return mastraMemoryStore.searchMemories(query, { limit, scope: 'company', organizationId });
  }
}

export class ProjectMemoryService {
  public static save(projectId: string, note: string, organizationId = 'org-default') {
    return mastraMemoryStore.saveMemory(projectId, note, 'project', [projectId], organizationId);
  }

  public static get(projectId: string, organizationId = 'org-default') {
    return mastraMemoryStore.getMemories(projectId, 10, organizationId);
  }
}
