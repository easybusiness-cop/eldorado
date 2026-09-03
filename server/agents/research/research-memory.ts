export interface ResearchSession {
  topic: string;
  findings: string[];
  citations: string[];
  timestamp: string;
}

export class ResearchMemory {
  private static sessions: ResearchSession[] = [];

  public static saveSession(session: ResearchSession) {
    this.sessions.push(session);
  }

  public static getSessions(): ResearchSession[] {
    return this.sessions;
  }
}
