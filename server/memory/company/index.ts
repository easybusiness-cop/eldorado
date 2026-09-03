import { MemoryRetrieval } from '../retrieval.ts';

export class CompanyMemory {
  public static addCorporatePolicy(policy: string): void {
    MemoryRetrieval.addRecord({
      scope: 'company',
      content: `Corporate Policy: ${policy}`,
      tags: ['policy', 'corporate'],
    });
  }
}
