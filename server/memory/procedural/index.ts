import { MemoryRetrieval } from '../retrieval.ts';

export class ProceduralMemory {
  public static saveProcedure(name: string, steps: string[]): void {
    MemoryRetrieval.addRecord({
      scope: 'procedural',
      content: `Procedure: ${name}\nSteps:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      tags: [name, 'procedure'],
    });
  }
}
