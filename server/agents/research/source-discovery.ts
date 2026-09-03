export class SourceDiscovery {
  public static async discoverSources(queries: string[]): Promise<{ url: string; title: string }[]> {
    return [
      { url: 'https://mastra.ai/docs/introduction', title: 'Mastra AI Docs: Core Concepts' },
      { url: 'https://github.com/mastra-ai/mastra', title: 'Mastra Repository Home' },
      { url: 'https://mastra.ai/reference/agents/agent-class', title: 'Agent SDK Class Reference' },
    ];
  }
}
