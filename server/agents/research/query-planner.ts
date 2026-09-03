export class QueryPlanner {
  public static planQueries(topic: string): string[] {
    // Break target question into multiple subquestions
    return [
      `What is the primary architecture of ${topic}?`,
      `What are the security limits and trade-offs of ${topic}?`,
      `How does ${topic} compare with standard alternative solutions?`,
    ];
  }
}
