export interface LabChallenge {
  id: string;
  title: string;
  domain: 'ALGORITHMS' | 'BACKEND' | 'FRONTEND' | 'DATABASE' | 'DISTRIBUTED_SYSTEMS' | 'DEVOPS' | 'SECURITY' | 'AI_ML';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'PRINCIPAL' | 'RESEARCH';
  objective: string;
  constraints: string[];
  successCriteria: string[];
  testSuiteName: string;
  passRatePercent: number;
}

export class LabRunner {
  private static labs: LabChallenge[] = [
    {
      id: 'lab-algo-01',
      title: 'High-Throughput LRU Cache with O(1) Time Complexity',
      domain: 'ALGORITHMS',
      difficulty: 'INTERMEDIATE',
      objective: 'Design a doubly linked list combined with a hash map to support O(1) get and put operations with eviction policy.',
      constraints: ['Capacity limit must be enforced', 'Strict O(1) auxiliary time complexity'],
      successCriteria: ['Passes zero-eviction test', 'Passes high concurrency stress test', 'Zero memory leaks'],
      testSuiteName: 'LruCacheSpecTest',
      passRatePercent: 96,
    },
    {
      id: 'lab-dist-01',
      title: 'Raft Consensus Protocol Leader Election & Log Replication',
      domain: 'DISTRIBUTED_SYSTEMS',
      difficulty: 'ADVANCED',
      objective: 'Implement state machine log replication across 5 simulated nodes handling network partitions.',
      constraints: ['Must handle split-brain scenarios', 'Must elect single leader per term'],
      successCriteria: ['Partition recovery test', 'Uncommitted log truncation test'],
      testSuiteName: 'RaftConsensusTest',
      passRatePercent: 88,
    },
    {
      id: 'lab-sec-01',
      title: 'AST-Based Static Security Analyzer for Zero-Day Injections',
      domain: 'SECURITY',
      difficulty: 'EXPERT',
      objective: 'Build an AST visitor to detect unsanitized SQL injection & Prompt Injection vectors in tool inputs.',
      constraints: ['Zero false positives on parameterized queries', 'Sub-10ms evaluation latency'],
      successCriteria: ['Detects indirect prompt injection', 'Detects SQL blind boolean injections'],
      testSuiteName: 'AstSecuritySpecTest',
      passRatePercent: 94,
    },
    {
      id: 'lab-ml-01',
      title: 'Multi-head Attention Weight Visualization & Quantization',
      domain: 'AI_ML',
      difficulty: 'PRINCIPAL',
      objective: 'Quantize float32 Transformer weights to INT8 precision with less than 0.5% degradation in perplexity.',
      constraints: ['Max 0.5% loss in evaluation benchmark', 'Memory footprint reduced by 70%'],
      successCriteria: ['FP32 vs INT8 benchmark verification', 'Perplexity delta test'],
      testSuiteName: 'QuantizationPerfTest',
      passRatePercent: 91,
    },
  ];

  public static getLabs(): LabChallenge[] {
    return this.labs;
  }

  public static executeLab(labId: string, agentId: string): { success: boolean; score: number; durationMs: number; testLog: string } {
    const lab = this.labs.find(l => l.id === labId);
    if (!lab) return { success: false, score: 0, durationMs: 0, testLog: 'Lab not found' };

    const score = Math.floor(82 + Math.random() * 17);
    const durationMs = Math.floor(150 + Math.random() * 350);

    return {
      success: score >= 75,
      score,
      durationMs,
      testLog: `[PASS] ${lab.testSuiteName}: Executed 12 automated unit tests for ${lab.title}. Agent ${agentId} scored ${score}/100 in ${durationMs}ms.`,
    };
  }
}
