export interface FailureRecord {
  id: string;
  agentId: string;
  taskId: string;
  skill?: string;
  failureType:
    | "REASONING"
    | "CODING"
    | "ARCHITECTURE"
    | "PERFORMANCE"
    | "SECURITY"
    | "TOOL"
    | "PLANNING";
  description: string;
  rootCause?: string;
  correction?: string;
  regressionTest?: string;
  createdAt: string;
}

export class FailureMemory {
  private records: FailureRecord[] = [];

  add(record: FailureRecord) {
    this.records.unshift(record);
    if (this.records.length > 10_000) {
      this.records.length = 10_000;
    }
  }

  getForAgent(agentId: string) {
    return this.records.filter((x) => x.agentId === agentId);
  }

  search(query: string) {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return this.records
      .map((record) => {
        const text = JSON.stringify(record).toLowerCase();
        const matches = terms.filter((term) => text.includes(term)).length;
        return {
          record,
          score: matches,
        };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.record);
  }
}

export const failureMemory = new FailureMemory();
