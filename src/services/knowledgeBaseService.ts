import { KnowledgeCategory, KnowledgeEntry, KnowledgeSearchFilter, KnowledgeBaseStats } from '../types/knowledgeBase';

const STORAGE_KEY = 'munderdifflin_dynamic_knowledge_base_v1';

export const INITIAL_KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  // 1. HACKING & CYBER SECURITY
  {
    id: 'kb-hack-01',
    title: 'Zero-Trust Perimeter Defense & Token Invalidation Protocol',
    category: 'hacking',
    summary: 'Rules for instantaneous JWT token revocation and perimeter rate limiting against credential-stuffing attacks.',
    content: 'All endpoints processing authentication must enforce asymmetric key rotation every 24 hours. If an IP triggers >15 failed attempts within 60 seconds, issue an automated firewall jail drop via Dwight Schrute defensive sentinel rules. Never store secrets in plain text or browser localStorage.',
    actionableInsight: 'Implement a distributed sliding-window rate limiter on /api/auth using in-memory token buckets to eliminate brute-force vector scans.',
    tags: ['zero-trust', 'rate-limiting', 'jwt', 'security-audit', 'firewall'],
    authorAgentId: 'dwight',
    authorAgentName: 'Dwight Schrute (CISO / Security)',
    authorAgentAvatar: '🛡️',
    confidenceScore: 0.98,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    usageCount: 42,
    verified: true,
    codeOrPayload: `// Zero-Trust Security Gatekeeper\nexport function checkPerimeterAccess(req: Request) {\n  const authHeader = req.headers.get('authorization');\n  if (!authHeader?.startsWith('Bearer ')) throw new Error('Untrusted perimeter access blocked');\n  return verifyJwtStrict(authHeader.split(' ')[1]);\n}`
  },
  {
    id: 'kb-hack-02',
    title: 'OWASP Top 10: Input Sanitization & SQL/NoSQL Injection Immunization',
    category: 'hacking',
    summary: 'Sanitization procedures for dynamic query builders and JSON payloads across backend micro-handlers.',
    content: 'Never concatenate raw input into query templates. Use parameterized prepared statements or validated object schemas. Strip malicious script tags, null-byte overflows (%00), and recursive regex payloads before passing into the business logic layer.',
    actionableInsight: 'Always wrap incoming user strings in strict validator functions before execution.',
    tags: ['owasp', 'injection-prevention', 'input-sanitization', 'vulnerability'],
    authorAgentId: 'dwight',
    authorAgentName: 'Dwight Schrute (CISO / Security)',
    authorAgentAvatar: '🛡️',
    confidenceScore: 0.99,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    usageCount: 38,
    verified: true,
    codeOrPayload: `const sanitized = rawInput.replace(/[<>'"\\\\;]/g, '');`
  },

  // 2. MARKETING
  {
    id: 'kb-mkt-01',
    title: 'High-Converting B2B SaaS Funnel: The "Hook, Value, Proof" Formula',
    category: 'marketing',
    summary: 'Strategic playbook for converting cold enterprise traffic into engaged trial users within 90 seconds.',
    content: 'Cold prospects decide within 5 seconds whether to stay. Structure all messaging around: 1) Urgent operational pain point, 2) Direct quantitative solution (e.g. 4x operational speedup), 3) Social proof / verified audit trail. Avoid buzzwords like "revolutionize" in favor of crisp ROI metrics.',
    actionableInsight: 'Place an interactive product simulation above the fold to double lead conversion over static contact forms.',
    tags: ['funnel-optimization', 'conversion-rate', 'b2b-messaging', 'value-prop'],
    authorAgentId: 'jim',
    authorAgentName: 'Jim Halpert (Marketing Lead)',
    authorAgentAvatar: '📢',
    confidenceScore: 0.94,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
    usageCount: 29,
    verified: true,
  },
  {
    id: 'kb-mkt-02',
    title: 'Email Nurture Sequence for Enterprise Procurement Approvals',
    category: 'marketing',
    summary: 'A 4-part automated email cadence targeting corporate decision makers with security & compliance assurances.',
    content: 'Email 1: Executive Summary & time saved. Email 2: Security & SOC2 zero-trust compliance sheet. Email 3: Direct case study on paper inventory savings. Email 4: Pilot invitation with zero migration friction.',
    actionableInsight: 'Include plain-text memos over heavy HTML flyers; plain-text emails generate 34% higher executive reply rates.',
    tags: ['email-marketing', 'enterprise-sales', 'nurture-cadence', 'b2b'],
    authorAgentId: 'jim',
    authorAgentName: 'Jim Halpert (Marketing Lead)',
    authorAgentAvatar: '📢',
    confidenceScore: 0.92,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
    usageCount: 19,
    verified: true,
  },

  // 3. FINANCE
  {
    id: 'kb-fin-01',
    title: 'Unit Economics: Cloud Compute Cost Allocation per Active Agent Cycle',
    category: 'finance',
    summary: 'Model for measuring and controlling cloud infrastructure spend per autonomous worker task.',
    content: 'Compute costs must be isolated by agent department. Target budget: <$0.004 per background reasoning loop. Runaway processes must be throttled if an agent exceeds 500,000 tokens within a 10-minute window without user interaction.',
    actionableInsight: 'Cache repetitive LLM system prompts and intermediate schemas to slash token processing overhead by 42%.',
    tags: ['unit-economics', 'cloud-costs', 'financial-audit', 'budgeting'],
    authorAgentId: 'kevin',
    authorAgentName: 'Kevin Malone (Finance & Accounting)',
    authorAgentAvatar: '📊',
    confidenceScore: 0.96,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    usageCount: 33,
    verified: true,
    codeOrPayload: `function calculateAgentRunCost(tokens: number, cycles: number) {\n  const tokenCost = (tokens / 1000) * 0.00015;\n  const serverCost = cycles * 0.0002;\n  return (tokenCost + serverCost).toFixed(4);\n}`
  },
  {
    id: 'kb-fin-02',
    title: 'SaaS Gross Margin Targets & Runway Burn Multiple Benchmark',
    category: 'finance',
    summary: 'Key financial ratios for sustaining a 24-month operating runway while expanding multi-agent fleet operations.',
    content: 'Target Gross Margin: >= 78%. Net Burn Multiple: Burn / Net New ARR should remain below 1.2x. Reconcile ledger items weekly to prevent invisible SaaS subscription creep across tooling and proxy nodes.',
    actionableInsight: 'Establish a monthly vendor cost audit to immediately cancel zombie third-party licenses.',
    tags: ['runway', 'burn-multiple', 'gross-margin', 'saas-metrics'],
    authorAgentId: 'kevin',
    authorAgentName: 'Kevin Malone (Finance & Accounting)',
    authorAgentAvatar: '📊',
    confidenceScore: 0.91,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    usageCount: 15,
    verified: true,
  },

  // 4. CODING
  {
    id: 'kb-code-01',
    title: 'Resilient TypeScript Architecture: Discriminated Unions & Strict Error Boundaries',
    category: 'coding',
    summary: 'Coding standards for preventing runtime crashes across asynchronous agent communication pipelines.',
    content: 'All agent messages and task statuses must be strongly typed with discriminated unions. Avoid "any" or loose "object" types. Wrap all async I/O handlers in try/catch blocks that return structured Result types with clear error codes rather than unhandled promise rejections.',
    actionableInsight: 'Use discriminated type fields like "status: \'success\' | \'error\'" to make invalid application states unrepresentable.',
    tags: ['typescript', 'error-handling', 'clean-code', 'type-safety'],
    authorAgentId: 'ruflo-coder',
    authorAgentName: 'Ruflo Coder (Engineering)',
    authorAgentAvatar: '💻',
    confidenceScore: 0.99,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
    usageCount: 51,
    verified: true,
    codeOrPayload: `type TaskResult<T> = \n  | { ok: true; data: T }\n  | { ok: false; error: string; code: number };`
  },
  {
    id: 'kb-code-02',
    title: 'Node.js Event Loop Protection: Offloading Heavy Computations to Micro-Tasks',
    category: 'coding',
    summary: 'Techniques for preventing event loop lag during continuous agent telemetry streaming.',
    content: 'Never block the Node.js event loop with synchronous loops >10ms. Chunk large arrays using setImmediate or process.nextTick. When computing complex analytics or graph traversals, break the work into discrete micro-tasks.',
    actionableInsight: 'Monitor event loop lag with perf_hooks; alert if lag exceeds 50ms.',
    tags: ['nodejs', 'event-loop', 'performance', 'async-patterns'],
    authorAgentId: 'ruflo-coder',
    authorAgentName: 'Ruflo Coder (Engineering)',
    authorAgentAvatar: '💻',
    confidenceScore: 0.97,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    usageCount: 27,
    verified: true,
  },

  // 5. SOCIAL MEDIA ACCOUNT MANAGEMENT
  {
    id: 'kb-soc-01',
    title: 'Algorithmic Content Cadence for LinkedIn & Multi-Platform Syndication',
    category: 'social_media',
    summary: 'Timing, format, and engagement rules to maximize algorithmic reach across enterprise accounts.',
    content: 'Publish core think-pieces between 8:00 AM - 10:30 AM EST on Tuesday and Thursday. The first 60 minutes determine 80% of total post reach. Prompt immediate discussion in the closing line. Never place outbound links in the post body—post links in the first comment.',
    actionableInsight: 'Opening lines must be under 8 words and trigger curiosity before the "see more" cutoff.',
    tags: ['linkedin-growth', 'posting-schedule', 'algorithm', 'engagement-rate'],
    authorAgentId: 'ryan',
    authorAgentName: 'Ryan Howard (Social Strategist)',
    authorAgentAvatar: '📱',
    confidenceScore: 0.95,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    usageCount: 44,
    verified: true,
  },
  {
    id: 'kb-soc-02',
    title: 'Viral Hook Construction & Retention Loop Framework',
    category: 'social_media',
    summary: 'Formulas for crafting high-retention video scripts and short-form social posts.',
    content: 'Structure: 0-3s Visual/Verbal Shock or Contrast -> 3-10s Contextual Tension -> 10-30s Practical Solution -> 30-45s Call to Action. Repurpose one core business insight into 3 distinct hooks (Contrarian, Numbered List, How-To Breakdown).',
    actionableInsight: 'Test 3 contrasting hooks on the same piece of media to find the highest-performing audience segment.',
    tags: ['viral-hooks', 'short-form-video', 'copywriting', 'social-strategy'],
    authorAgentId: 'ryan',
    authorAgentName: 'Ryan Howard (Social Strategist)',
    authorAgentAvatar: '📱',
    confidenceScore: 0.93,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
    usageCount: 31,
    verified: true,
  }
];

class KnowledgeBaseService {
  private entries: KnowledgeEntry[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadEntries();
  }

  private loadEntries() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.entries = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read knowledge base from localStorage, using initial dataset:', e);
    }
    this.entries = [...INITIAL_KNOWLEDGE_ENTRIES];
    this.saveEntries();
  }

  private saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch (e) {
      console.warn('Could not save knowledge base to localStorage:', e);
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('Error in knowledge base listener:', e);
      }
    });
  }

  public getAll(): KnowledgeEntry[] {
    return [...this.entries];
  }

  public search(filter: KnowledgeSearchFilter): KnowledgeEntry[] {
    const query = (filter.query || '').trim().toLowerCase();
    const category = filter.category;
    const tag = (filter.tag || '').trim().toLowerCase();
    const author = filter.authorAgentId;

    return this.entries.filter((entry) => {
      if (category && category !== 'all' && entry.category !== category) {
        return false;
      }
      if (author && entry.authorAgentId !== author) {
        return false;
      }
      if (tag && !entry.tags.some((t) => t.toLowerCase() === tag)) {
        return false;
      }
      if (query) {
        const matchTitle = entry.title.toLowerCase().includes(query);
        const matchSummary = entry.summary.toLowerCase().includes(query);
        const matchContent = entry.content.toLowerCase().includes(query);
        const matchInsight = entry.actionableInsight.toLowerCase().includes(query);
        const matchTags = entry.tags.some((t) => t.toLowerCase().includes(query));
        const matchAuthor = entry.authorAgentName.toLowerCase().includes(query);
        if (!matchTitle && !matchSummary && !matchContent && !matchInsight && !matchTags && !matchAuthor) {
          return false;
        }
      }
      return true;
    });
  }

  public addEntry(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'verified'>): KnowledgeEntry {
    const newEntry: KnowledgeEntry = {
      ...entry,
      id: `kb-${entry.category}-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 1,
      verified: true,
    };
    this.entries = [newEntry, ...this.entries];
    this.saveEntries();
    return newEntry;
  }

  /**
   * Automatically synthesize and record newly learned intelligence from an agent's task execution
   */
  public recordAgentLearning(
    agentName: string,
    agentId: string,
    taskTitle: string,
    taskOutput: string,
    category: KnowledgeCategory,
    avatar?: string
  ): KnowledgeEntry {
    const cleanOutput = taskOutput.replace(/```[\s\S]*?```/g, '').trim();
    const firstSentence = cleanOutput.split('.')[0] || taskTitle;
    const summary = firstSentence.length > 180 ? firstSentence.slice(0, 180) + '...' : firstSentence;

    const newEntry: KnowledgeEntry = {
      id: `kb-learned-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `${agentName}: ${taskTitle.slice(0, 50)}`,
      category,
      summary: `Automated agent learning distilled from live mission: ${summary}`,
      content: taskOutput.slice(0, 1200),
      actionableInsight: `Operational finding by ${agentName}: Execute verification tests and cross-reference with existing ${category} standards.`,
      tags: [category, 'agent-learned', agentId, 'realtime-insight'],
      authorAgentId: agentId,
      authorAgentName: agentName,
      authorAgentAvatar: avatar || '⚡',
      confidenceScore: Math.min(0.99, 0.88 + Math.random() * 0.1),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 1,
      verified: true,
    };

    this.entries = [newEntry, ...this.entries];
    this.saveEntries();
    return newEntry;
  }

  public upvote(id: string): void {
    this.entries = this.entries.map((e) => {
      if (e.id === id) {
        return { ...e, usageCount: e.usageCount + 1, updatedAt: Date.now() };
      }
      return e;
    });
    this.saveEntries();
  }

  public getStats(): KnowledgeBaseStats {
    const counts: Record<KnowledgeCategory, number> = {
      hacking: 0,
      marketing: 0,
      finance: 0,
      coding: 0,
      social_media: 0,
    };

    let agentLearned = 0;
    let latest = 0;

    for (const e of this.entries) {
      if (counts[e.category] !== undefined) {
        counts[e.category]++;
      }
      if (e.tags.includes('agent-learned') || e.id.startsWith('kb-learned')) {
        agentLearned++;
      }
      if (e.createdAt > latest) {
        latest = e.createdAt;
      }
    }

    return {
      totalEntries: this.entries.length,
      categoryCounts: counts,
      totalLearnedByAgents: agentLearned,
      latestUpdate: latest || Date.now(),
    };
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
