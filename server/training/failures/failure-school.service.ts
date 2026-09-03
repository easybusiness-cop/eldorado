export interface FailureRecord {
  id: string;
  agentId: string;
  taskTitle: string;
  category: 'SYNTAX_ERROR' | 'TYPE_MISMATCH' | 'TIMEOUT' | 'LOGIC_BUG' | 'SECURITY_VIOLATION' | 'RESOURCE_EXHAUSTION';
  attemptedSolution: string;
  failureLog: string;
  rootCause: string;
  correctiveFix: string;
  generatedLesson: string;
  affectedCapabilities: string[];
  regressionTestCreated: boolean;
  timestamp: string;
}

export class FailureSchoolService {
  private static failures: FailureRecord[] = [
    {
      id: 'fail-001',
      agentId: 'ruflo-coder',
      taskTitle: 'Refactor GitHub commit tool input destructuring',
      category: 'TYPE_MISMATCH',
      attemptedSolution: 'execute: async ({ input }) => { CommitService.createCommit(input.repo...); }',
      failureLog: 'Property input does not exist on type { repo: string; branch: string; }',
      rootCause: 'Zod schema tools pass destructured parameters directly to execute handler rather than wrapping in an inner input object',
      correctiveFix: 'execute: async ({ repo, branch, message, files }) => { ... }',
      generatedLesson: 'Always match execution signature directly with inputSchema field names in Mastra createTool calls.',
      affectedCapabilities: ['mastra_tool_creation', 'type_safety'],
      regressionTestCreated: true,
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'fail-002',
      agentId: 'ruflo-ml-spec',
      taskTitle: 'Vector embedding generation API response extraction',
      category: 'TYPE_MISMATCH',
      attemptedSolution: 'const values = res.embedding.values',
      failureLog: 'Property embedding does not exist on type EmbedContentResponse. Did you mean embeddings?',
      rootCause: 'SDK version differences between singular embedding vs array embeddings response fields',
      correctiveFix: 'const values = res?.embedding?.values || res?.embeddings?.[0]?.values',
      generatedLesson: 'Use defensive optional chaining and array fallbacks when extracting Gemini SDK embedding payloads.',
      affectedCapabilities: ['vector_embeddings', 'sdk_integration'],
      regressionTestCreated: true,
      timestamp: new Date(Date.now() - 3600000 * 16).toISOString(),
    },
  ];

  public static getFailures(): FailureRecord[] {
    return this.failures;
  }

  public static recordFailure(
    agentId: string,
    taskTitle: string,
    category: FailureRecord['category'],
    attemptedSolution: string,
    failureLog: string,
    rootCause: string,
    correctiveFix: string,
    generatedLesson: string,
    affectedCapabilities: string[]
  ): FailureRecord {
    const record: FailureRecord = {
      id: `fail-${Date.now()}`,
      agentId,
      taskTitle,
      category,
      attemptedSolution,
      failureLog,
      rootCause,
      correctiveFix,
      generatedLesson,
      affectedCapabilities,
      regressionTestCreated: true,
      timestamp: new Date().toISOString(),
    };

    this.failures.unshift(record);
    return record;
  }
}
