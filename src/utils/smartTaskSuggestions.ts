import { Agent, AgentSkill } from '../types';

export interface SmartTaskSuggestion {
  taskId: string;
  title: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  matchScore: number; // 0-100%
  primarySkill: string;
  matchingSkills: string[];
  estimatedDuration: string;
  difficultyScore: number; // 1-10
  complexityLabel: string;
  reasoning: string;
  impact: string;
  suggestedActionLabel: string;
}

// Curated matrix of expert task archetypes mapped to skill patterns
interface TaskArchetype {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  keywords: string[];
  matrixCategory?: 'marketing' | 'finance' | 'coding' | 'security' | 'operations' | 'quantum';
  estimatedDuration: string;
  difficultyScore: number;
  complexityLabel: string;
  reasoningTemplate: (agentName: string, skill: string) => string;
  impact: string;
}

const TASK_ARCHETYPES: TaskArchetype[] = [
  // Engineering & Backend
  {
    id: 'task-opt-api-serializer',
    title: 'Refactor REST & WebSocket Gateways for Zero-Copy Fast Serialization',
    category: 'Backend & Systems',
    matrixCategory: 'coding',
    priority: 'high',
    keywords: ['node.js', 'typescript', 'express', 'api', 'backend', 'system architecture', 'systems', 'microservices', 'coding'],
    estimatedDuration: '25 min',
    difficultyScore: 4,
    complexityLabel: 'Moderate Overhead',
    reasoningTemplate: (name, skill) => `${name}'s mastery in ${skill} provides the exact high-throughput optimization needed for socket gateways.`,
    impact: '+38% message throughput and sub-millisecond IPC latency'
  },
  {
    id: 'task-db-indexing-migration',
    title: 'Execute Composite Index Migration & Hot Partition Tuning',
    category: 'Database Architecture',
    matrixCategory: 'coding',
    priority: 'high',
    keywords: ['database', 'sql', 'drizzle orm', 'postgres', 'postgresql', 'drizzle', 'migrations', 'query optimization', 'coding'],
    estimatedDuration: '20 min',
    difficultyScore: 3,
    complexityLabel: 'Low Overhead',
    reasoningTemplate: (name, skill) => `Leveraging ${name}'s ${skill} proficiency ensures zero-downtime schema migrations.`,
    impact: '-72% query latency on multi-tenant audit table scans'
  },
  {
    id: 'task-fe-component-tree',
    title: 'Virtualize Fleet State Tree & Eliminate Redundant React Rerenders',
    category: 'Frontend Engineering',
    matrixCategory: 'coding',
    priority: 'normal',
    keywords: ['react', 'react 19', 'tailwind', 'vite', 'ui', 'frontend', 'components', 'css', 'state management', 'zustand', 'coding'],
    estimatedDuration: '18 min',
    difficultyScore: 2,
    complexityLabel: 'Minimal / Easiest',
    reasoningTemplate: (name, skill) => `${name}'s domain strength in ${skill} is optimal for tuning UI rendering pipelines.`,
    impact: 'Stable 60 FPS across all real-time simulation viewports'
  },

  // Security & SOC
  {
    id: 'task-sec-zero-trust-audit',
    title: 'Audit Egress Boundaries & Enforce Zero-Trust Dynamic Policy Gates',
    category: 'Cybersecurity & SOC',
    matrixCategory: 'security',
    priority: 'critical',
    keywords: ['security', 'vulnerability', 'defensive security', 'ssrf', 'access control', 'owasp', 'penetration', 'zero-trust', 'firewall'],
    estimatedDuration: '30 min',
    difficultyScore: 5,
    complexityLabel: 'Deep Inspection',
    reasoningTemplate: (name, skill) => `${name}'s certified background in ${skill} guarantees rigorous vulnerability containment.`,
    impact: 'Closes potential vector chains across remote tool integrations'
  },
  {
    id: 'task-sec-credential-rotation',
    title: 'Automate Secret Key Rotation & Redact Ingress Telemetry Traces',
    category: 'Security & Compliance',
    matrixCategory: 'security',
    priority: 'high',
    keywords: ['credential', 'key redactor', 'audit', 'compliance', 'secrets', 'dependency auditing', 'log inspection', 'security'],
    estimatedDuration: '15 min',
    difficultyScore: 2,
    complexityLabel: 'Minimal / Easiest',
    reasoningTemplate: (name, skill) => `Perfect match for ${name} to apply ${skill} rules to corporate token stores.`,
    impact: '100% clean audit ledger with automatic secret obfuscation'
  },

  // AI & Machine Learning
  {
    id: 'task-ai-prompt-eval',
    title: 'Run Multi-Model Evaluation Matrix & Tune Speculative Decoding Prompt Weights',
    category: 'AI / LLM Research',
    matrixCategory: 'quantum',
    priority: 'high',
    keywords: ['gemini', 'llm', 'neural', 'machine learning', 'prompt engineering', 'vector', 'model evaluation', 'ai research', 'embedding', 'quantum'],
    estimatedDuration: '35 min',
    difficultyScore: 4,
    complexityLabel: 'Analytical Focus',
    reasoningTemplate: (name, skill) => `${name}'s expertise in ${skill} is primed for hyperparameter and reasoning quality tuning.`,
    impact: '+19% factual precision on multi-step reasoning queries'
  },

  // Leadership, Strategy & Management
  {
    id: 'task-mgmt-swarm-dispatch',
    title: 'Orchestrate Cross-Department Swarm Allocation & Rebalance Workload Ring',
    category: 'Fleet Leadership',
    matrixCategory: 'operations',
    priority: 'high',
    keywords: ['leadership', 'strategy', 'delegation', 'prioritization', 'management', 'crisis management', 'company planning', 'standups', 'coordination', 'operations'],
    estimatedDuration: '12 min',
    difficultyScore: 2,
    complexityLabel: 'Minimal / Easiest',
    reasoningTemplate: (name, skill) => `${name}'s executive authority and ${skill} skill make them ideal for unblocking team queues.`,
    impact: 'Zero idle workers and optimal resource utilization'
  },

  // Operations, QA & SRE
  {
    id: 'task-ops-sre-telemetry',
    title: 'Calibrate Health Probes & Implement Self-Healing Circuit Breakers',
    category: 'SRE & DevOps',
    matrixCategory: 'operations',
    priority: 'normal',
    keywords: ['sre', 'uptime', 'monitoring', 'telemetry', 'self-healing', 'devops', 'docker', 'ci/cd', 'garbage collection', 'operations'],
    estimatedDuration: '22 min',
    difficultyScore: 3,
    complexityLabel: 'Low Overhead',
    reasoningTemplate: (name, skill) => `${name}'s specialized focus on ${skill} ensures high reliability across container nodes.`,
    impact: 'Guarantees 99.99% uptime with autonomous crash failover'
  },
  {
    id: 'task-ops-sop-documentation',
    title: 'Draft Interactive Runbook & Formalize Department Operating Procedures',
    category: 'Operations & SOP',
    matrixCategory: 'operations',
    priority: 'normal',
    keywords: ['documentation', 'sop', 'process operations', 'resource planning', 'training', 'writing', 'standards', 'operations'],
    estimatedDuration: '20 min',
    difficultyScore: 1,
    complexityLabel: 'Minimal / Easiest',
    reasoningTemplate: (name, skill) => `${name} excels at ${skill}, perfectly suited to codifying department workflows.`,
    impact: 'Accelerates onboarding velocity and cross-agent alignment'
  },

  // Marketing, Growth & Finance
  {
    id: 'task-growth-experiment',
    title: 'Launch A/B Funnel Optimization & Automated Lead Nurturing Sequence',
    category: 'Growth & Outreach',
    matrixCategory: 'marketing',
    priority: 'normal',
    keywords: ['marketing', 'seo', 'growth', 'a/b testing', 'lead conversion', 'social automation', 'copywriting', 'acquisition', 'sales'],
    estimatedDuration: '25 min',
    difficultyScore: 2,
    complexityLabel: 'Low Overhead',
    reasoningTemplate: (name, skill) => `${name}'s track record in ${skill} will maximize campaign conversion yield.`,
    impact: '+24% conversion velocity on inbound pipeline leads'
  },
  {
    id: 'task-fin-budget-audit',
    title: 'Perform Token Expenditure Variance Audit & Unit Economics Reconciliation',
    category: 'Finance & Analytics',
    matrixCategory: 'finance',
    priority: 'high',
    keywords: ['finance', 'accounting', 'budget', 'runway', 'cost tracking', 'financial analysis', 'ledger', 'reporting'],
    estimatedDuration: '15 min',
    difficultyScore: 2,
    complexityLabel: 'Minimal / Easiest',
    reasoningTemplate: (name, skill) => `${name}'s precision in ${skill} provides immediate visibility into operational burn.`,
    impact: 'Identifies $1,400/mo in unused inference and compute savings'
  }
];

/**
 * Extracts raw skill names from an agent regardless of format
 */
export function extractAgentSkillNames(agent: Agent): string[] {
  const list: string[] = [];

  // 1. Structured agent.skills
  if (Array.isArray(agent.skills) && agent.skills.length > 0) {
    agent.skills.forEach(s => {
      if (typeof s === 'string') {
        list.push(s);
      } else if (s && typeof s.name === 'string') {
        list.push(s.name);
      }
    });
  }

  // 2. Check stored skill matrix profile from local storage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedMatrix = localStorage.getItem('munderdifflin_agent_skills');
      if (storedMatrix) {
        const parsed = JSON.parse(storedMatrix);
        if (parsed[agent.id]?.topSkills && Array.isArray(parsed[agent.id].topSkills)) {
          list.push(...parsed[agent.id].topSkills);
        }
      }
    } catch {
      // Ignore parse failure
    }
  }

  // 3. Role capabilities
  if (agent.agentRole?.capabilities && Array.isArray(agent.agentRole.capabilities)) {
    list.push(...agent.agentRole.capabilities);
  }

  // 4. Fallbacks from role / department keywords
  if (agent.role) {
    list.push(...agent.role.split(/[\s/,&-]+/));
  }
  if (agent.title) {
    list.push(...agent.title.split(/[\s/,&-]+/));
  }
  if (agent.department) {
    list.push(agent.department);
  }

  return Array.from(new Set(list.filter(Boolean)));
}

/**
 * Computes the optimal smart task suggestion for an agent based on skills and proficiencies
 */
export function getSmartTaskSuggestion(agent: Agent): SmartTaskSuggestion {
  const skillNames = extractAgentSkillNames(agent);
  const normalizedSkills = skillNames.map(s => s.toLowerCase().trim());
  const agentDisplayName = agent.nickname || agent.name.split(' ')[0] || 'Agent';

  // Read live skill scores if available in matrix storage
  let matrixScores: Record<string, number> = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedMatrix = localStorage.getItem('munderdifflin_agent_skills');
      if (storedMatrix) {
        const parsed = JSON.parse(storedMatrix);
        if (parsed[agent.id]?.scores) {
          matrixScores = parsed[agent.id].scores;
        }
      }
    } catch {
      // ignore
    }
  }

  let bestArchetype = TASK_ARCHETYPES[0];
  let highestScore = -1;
  let matchingSkillsFound: string[] = [];
  let primarySkillUsed = skillNames[0] || 'Core Capabilities';

  for (const archetype of TASK_ARCHETYPES) {
    let score = 0;
    const currentMatched: string[] = [];

    for (const keyword of archetype.keywords) {
      const matchIdx = normalizedSkills.findIndex(s => s.includes(keyword) || keyword.includes(s));
      if (matchIdx !== -1) {
        score += 18;
        currentMatched.push(skillNames[matchIdx] || keyword);
      }
    }

    // Boost score if agent's department / role aligns with archetype category
    const agentRoleLower = (agent.role || '').toLowerCase();
    const agentDeptLower = (agent.department || '').toLowerCase();
    if (archetype.keywords.some(k => agentRoleLower.includes(k) || agentDeptLower.includes(k))) {
      score += 25;
    }

    // Boost based on live skill matrix score for this category
    if (archetype.matrixCategory && matrixScores[archetype.matrixCategory]) {
      score += Math.floor(matrixScores[archetype.matrixCategory] * 0.4);
    }

    // Role-specific heuristics for known canonical fleet members
    if (agent.id === 'michael' && archetype.category === 'Fleet Leadership') score += 40;
    if (agent.id === 'jim' && archetype.category === 'Frontend Engineering') score += 35;
    if (agent.id === 'kevin' && archetype.category === 'Finance & Analytics') score += 45;
    if (agent.id === 'dwight' && archetype.category === 'Cybersecurity & SOC') score += 40;
    if (agent.id === 'ryan' && archetype.category === 'Growth & Outreach') score += 35;
    if (agent.id === 'pam' && archetype.category === 'Operations & SOP') score += 35;
    if (agent.id === 'cline' && archetype.category === 'Backend & Systems') score += 40;
    if (agent.id === 'stanley' && archetype.category === 'Operations & SOP') score += 30;

    if (score > highestScore) {
      highestScore = score;
      bestArchetype = archetype;
      matchingSkillsFound = currentMatched.length > 0 ? currentMatched : [skillNames[0] || 'General Skills'];
      primarySkillUsed = matchingSkillsFound[0] || skillNames[0] || 'System Architecture';
    }
  }

  // Calculate percentage match (bounded 88% - 99%)
  const boundedMatchScore = Math.min(99, Math.max(88, Math.floor(78 + Math.min(21, highestScore * 0.35))));

  // Check if agent has difficulty preference from quantum state
  const quantumDiff = agent.quantumState?.superpositionCandidates?.find(
    c => c.complexity === 'Minimal / Easiest'
  )?.difficultyScore;
  const effectiveDifficulty = quantumDiff ? Math.min(bestArchetype.difficultyScore, quantumDiff) : bestArchetype.difficultyScore;

  return {
    taskId: `smart-${agent.id}-${bestArchetype.id}`,
    title: bestArchetype.title,
    category: bestArchetype.category,
    priority: bestArchetype.priority,
    matchScore: boundedMatchScore,
    primarySkill: primarySkillUsed,
    matchingSkills: Array.from(new Set(matchingSkillsFound)).slice(0, 3),
    estimatedDuration: bestArchetype.estimatedDuration,
    difficultyScore: effectiveDifficulty,
    complexityLabel: bestArchetype.complexityLabel,
    reasoning: bestArchetype.reasoningTemplate(agentDisplayName, primarySkillUsed),
    impact: bestArchetype.impact,
    suggestedActionLabel: '⚡ Queue Directive'
  };
}
