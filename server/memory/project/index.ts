import { MemoryRetrieval } from '../retrieval.ts';

export class ProjectMemory {
  public static saveProjectSpec(projectId: string, spec: string): void {
    MemoryRetrieval.addRecord({
      scope: 'project',
      content: `Project Specification [${projectId}]: ${spec}`,
      tags: [projectId, 'spec'],
    });
  }
}
