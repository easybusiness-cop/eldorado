import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Agent, FleetTask } from '../types';
import { KnowledgeCategory, KnowledgeEntry } from '../types/knowledgeBase';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { soundFx } from '../utils/speech';
import { AgentCommunicationThreads } from './AgentCommunicationThreads';
import { AgentSkillMatrix } from './AgentSkillMatrix';
import { AgentSops } from './AgentSops';

interface MunderdifflinDashboardProps {
  agents: Agent[];
  tasks: FleetTask[];
  onAddTask: (task: Partial<FleetTask>) => Promise<void> | void;
  onAddAgent?: (agent: Agent) => void;
  onSelectAgent?: (agentId: string) => void;
  selectedAgentId?: string;
  onClose?: () => void;
  initialTab?: 'roster_and_assign' | 'monitor' | 'outputs' | 'knowledge' | 'pipelines' | 'communication' | 'skills' | 'sops';
}

// Specialty mapping to help user find agents for specific roles
const ROLE_SPECIALTIES: Record<string, { category: KnowledgeCategory; label: string; icon: string; agentId: string; description: string }> = {
  hacker: {
    category: 'hacking',
    label: 'Cyber Security & Hacker',
    icon: '🛡️',
    agentId: 'dwight',
    description: 'Offensive & defensive penetration testing, vulnerability auditing, zero-trust rules',
  },
  hr: {
    category: 'marketing',
    label: 'HR & People Operations',
    icon: '👥',
    agentId: 'pam',
    description: 'Employee relations, policy documentation, onboarding, internal culture & compliance',
  },
  marketing: {
    category: 'marketing',
    label: 'Marketing & Outreach',
    icon: '📢',
    agentId: 'jim',
    description: 'Lead generation, B2B acquisition funnels, campaign copy, product positioning',
  },
  finance: {
    category: 'finance',
    label: 'Finance & Accounting',
    icon: '📊',
    agentId: 'kevin',
    description: 'P&L reconciliations, cloud unit costs, runway projections, invoice auditing',
  },
  coding: {
    category: 'coding',
    label: 'Full-Stack Coding & Engineering',
    icon: '💻',
    agentId: 'ruflo-coder',
    description: 'TypeScript/React architecture, API microservices, bug refactoring, database schemas',
  },
  social_media: {
    category: 'social_media',
    label: 'Social Media Management',
    icon: '📱',
    agentId: 'ryan',
    description: 'Viral hook generation, multi-platform publishing cadence, engagement analytics',
  },
};

// Quick mission presets for fast 1-click execution
const QUICK_PRESETS: Record<string, Array<{ title: string; category: KnowledgeCategory; priority: 'low' | 'medium' | 'high' | 'critical'; prompt: string }>> = {
  dwight: [
    {
      title: 'Perimeter Security Audit & Port Scan',
      category: 'hacking',
      priority: 'high',
      prompt: 'Execute a comprehensive zero-trust penetration scan across all API endpoints. Verify rate-limiting shields, token validation, and ensure zero perimeter breaches.',
    },
    {
      title: 'SQL & NoSQL Injection Vulnerability Test',
      category: 'hacking',
      priority: 'critical',
      prompt: 'Perform defensive input sanitization audit on all database and server parameters. Check against OWASP Top 10 injection vectors and generate a hardened patch.',
    },
    {
      title: 'Secret Vault & Environment Audit',
      category: 'hacking',
      priority: 'high',
      prompt: 'Audit runtime environment variables and ensure no sensitive secrets or keys are exposed in client-side bundles or public endpoints.',
    },
  ],
  pam: [
    {
      title: 'Draft Remote Employee Compliance Policy',
      category: 'marketing',
      priority: 'medium',
      prompt: 'Draft an official Scranton branch inter-office memo outlining remote employee standards, data security compliance, core working hours, and peer escalation protocols.',
    },
    {
      title: 'Quarterly Team Morale & Health Survey',
      category: 'marketing',
      priority: 'normal' as any,
      prompt: 'Create an engaging 5-question inter-department pulse survey evaluating workload distribution, psychological safety, and cross-functional team alignment.',
    },
    {
      title: 'New Autonomous Agent Onboarding Guide',
      category: 'marketing',
      priority: 'high',
      prompt: 'Design an end-to-end onboarding checklist for newly provisioned autonomous worker agents, covering authority level provisioning, tool assignments, and code guidelines.',
    },
  ],
  jim: [
    {
      title: 'B2B Enterprise Client Acquisition Campaign',
      category: 'marketing',
      priority: 'high',
      prompt: 'Design a high-converting 3-touchpoint outbound marketing campaign targeting corporate procurement managers, highlighting 40% paper supply savings.',
    },
    {
      title: 'Quarterly Value Proposition & Case Study',
      category: 'marketing',
      priority: 'medium',
      prompt: 'Synthesize a compelling customer success case study showcasing how switching to autonomous fleet logistics slashed delivery turnarounds from 3 days to 4 hours.',
    },
    {
      title: 'Product Launch Email Sequence',
      category: 'marketing',
      priority: 'medium',
      prompt: 'Write an irresistible 3-part teaser email sequence for the new Rufflo Autonomous Paper Catalog with clear CTAs and zero marketing fluff.',
    },
  ],
  kevin: [
    {
      title: 'Cloud Compute Cost Reconciliation & Ledger',
      category: 'finance',
      priority: 'high',
      prompt: 'Audit monthly server compute, memory usage, and token consumption. Calculate per-agent operational unit costs and formulate 3 cost-cutting measures.',
    },
    {
      title: 'Runway & Burn Multiple Health Check',
      category: 'finance',
      priority: 'critical',
      prompt: 'Calculate the Scranton branch operational runway under current burn rates. Provide a 12-month financial projection with gross margin sensitivity analysis.',
    },
    {
      title: 'Automated Invoice Reconciliation Sheet',
      category: 'finance',
      priority: 'medium',
      prompt: 'Audit recent accounts receivable items, identify pending client balances, and draft automated payment reminders with 2% early payment discount terms.',
    },
  ],
  'ruflo-coder': [
    {
      title: 'Async Retry Loop with Exponential Backoff',
      category: 'coding',
      priority: 'high',
      prompt: 'Implement a production-grade TypeScript utility for retrying transient network failures with exponential backoff, jitter, and strict discriminated union typing.',
    },
    {
      title: 'React 19 State & Memory Leak Refactor',
      category: 'coding',
      priority: 'medium',
      prompt: 'Audit component lifecycle hooks and event subscriptions. Eliminate detached DOM references and ensure clean cancellation of in-flight fetch abort controllers.',
    },
    {
      title: 'API Gateway Rate-Limiter Middleware',
      category: 'coding',
      priority: 'critical',
      prompt: 'Write an Express middleware module that implements a token bucket rate-limiter, logging client IP addresses and issuing HTTP 429 status codes when exceeded.',
    },
  ],
  ryan: [
    {
      title: 'Viral Short-Form Hook & Caption Framework',
      category: 'social_media',
      priority: 'high',
      prompt: 'Generate 5 high-contrast video hooks with 30-second script outlines and strategic hashtag clusters targeting modern tech entrepreneurs.',
    },
    {
      title: 'LinkedIn Thought-Leadership Content Plan',
      category: 'social_media',
      priority: 'medium',
      prompt: 'Create a 5-day publishing calendar breaking down autonomous enterprise AI trends, formatted for high algorithmic retention and comment virality.',
    },
    {
      title: 'Multi-Platform Community Sentiment Analysis',
      category: 'social_media',
      priority: 'normal' as any,
      prompt: 'Analyze public audience sentiment across Twitter/X and LinkedIn regarding autonomous business automation, and outline an actionable engagement playbook.',
    },
  ],
};

export interface PipelineStep {
  agentId: string;
  agentName: string;
  role: string;
  actionTitle: string;
  instructions: string;
  outputKey: string;
  stepNumber?: number;
}

export interface PipelinePreset {
  id: string;
  title: string;
  badge: string;
  icon?: string;
  estimatedTime?: string;
  description: string;
  steps: PipelineStep[];
}

export const WORKFLOW_PIPELINES: PipelinePreset[] = [
  {
    id: 'pipe-launch',
    title: 'Enterprise Product Launch Pipeline',
    badge: '🚀 Multi-Department',
    description: 'Chains Marketing (Jim) ➔ Social Growth (Ryan) ➔ Finance (Kevin) ➔ Cyber Security (Dwight) into an airtight, audit-compliant launch package.',
    steps: [
      {
        agentId: 'jim',
        agentName: 'Jim Halpert',
        role: 'Marketing & Sales',
        actionTitle: 'Step 1: B2B Enterprise Value Proposition',
        instructions: 'Formulate a 3-touchpoint acquisition funnel highlighting 40% procurement savings, guaranteed 4-hour replenishment SLA, and autonomous API re-order hooks.',
        outputKey: 'value_proposition',
      },
      {
        agentId: 'ryan',
        agentName: 'Ryan Howard',
        role: 'Social Media & Growth',
        actionTitle: 'Step 2: Viral Multi-Platform Campaign & Teasers',
        instructions: 'Translate Jim\'s value proposition into high-engagement LinkedIn and X thread hooks with clear CTA links for corporate demo scheduling.',
        outputKey: 'social_campaign',
      },
      {
        agentId: 'kevin',
        agentName: 'Kevin Malone',
        role: 'Finance & Accounting',
        actionTitle: 'Step 3: Unit Economics & Compute Margin Audit',
        instructions: 'Model customer acquisition cost (CAC) vs. lifetime value (LTV), compute server infrastructure overhead per tenant, and define profitable tier pricing.',
        outputKey: 'financial_model',
      },
      {
        agentId: 'dwight',
        agentName: 'Dwight Schrute',
        role: 'Cyber Security & Defense',
        actionTitle: 'Step 4: Threat Model & Zero-Trust Verification',
        instructions: 'Execute an exhaustive pre-flight threat assessment on customer onboarding webhooks, token lifespans, and API rate shields.',
        outputKey: 'security_audit',
      },
    ],
  },
  {
    id: 'pipe-security',
    title: 'Zero-Trust Hardening & Compliance Chain',
    badge: '🛡️ Cyber & Ops',
    description: 'Autonomous cyber scan (Dwight) ➔ Employee Policy Memo (Pam) ➔ Engineering TypeScript Patch (Coder).',
    steps: [
      {
        agentId: 'dwight',
        agentName: 'Dwight Schrute',
        role: 'Cyber Security & Defense',
        actionTitle: 'Step 1: Perimeter Vulnerability & CVE Scan',
        instructions: 'Audit public ingress endpoints, verify cryptographic token signatures, and flag any OWASP Top 10 vulnerabilities.',
        outputKey: 'cve_audit',
      },
      {
        agentId: 'pam',
        agentName: 'Pam Beesly',
        role: 'HR & People Operations',
        actionTitle: 'Step 2: Inter-Office Security Compliance Memo',
        instructions: 'Draft an official Scranton executive memo explaining updated token rotation policies, password complexity rules, and peer escalation chains.',
        outputKey: 'hr_memo',
      },
      {
        agentId: 'ruflo-coder',
        agentName: 'Ruflo Coder',
        role: 'Full-Stack Engineering',
        actionTitle: 'Step 3: Production Code Patch Deployment',
        instructions: 'Synthesize production-grade TypeScript middleware enforcing strict input sanitization, rate limiting, and defensive request boundaries.',
        outputKey: 'code_patch',
      },
    ],
  },
  {
    id: 'pipe-growth',
    title: 'Scranton Growth & Unit Economics Chain',
    badge: '📈 Revenue & Scale',
    description: 'Cost ledger reconciliation (Kevin) ➔ Enterprise Renewal Funnel (Jim) ➔ Organic Growth Loops (Ryan).',
    steps: [
      {
        agentId: 'kevin',
        agentName: 'Kevin Malone',
        role: 'Finance & Accounting',
        actionTitle: 'Step 1: Operational Ledger Reconciliation',
        instructions: 'Calculate current monthly server burn, gross margins across paper grades, and identify $12,400 in annualized cost savings.',
        outputKey: 'ledger_audit',
      },
      {
        agentId: 'jim',
        agentName: 'Jim Halpert',
        role: 'Marketing & Sales',
        actionTitle: 'Step 2: Enterprise Renewal & Upsell Pitch',
        instructions: 'Draft customized contract renewal proposals for top 20 corporate accounts with 2-year commitment incentives.',
        outputKey: 'renewal_pitch',
      },
      {
        agentId: 'ryan',
        agentName: 'Ryan Howard',
        role: 'Social Media & Growth',
        actionTitle: 'Step 3: Viral Community Distribution Loop',
        instructions: 'Design an organic referral loop where corporate clients unlock automated procurement analytics by referring sister branches.',
        outputKey: 'viral_loop',
      },
    ],
  },
];

const generatePipelineStepDeliverable = (step: PipelineStep, stepIndex: number, pipeline: PipelinePreset) => {
  if (step.agentId === 'jim') {
    return {
      memo: `OFFICIAL PROPOSAL - B2B ENTERPRISE PAPER & AUTOMATION INCENTIVES\nPrepared by: Jim Halpert (Enterprise Sales & Strategic Accounts)\n\n1. Executive Proposition:\nAutonomous paper supply logistics integrated with client ERP webhooks.\n- Guaranteed 40% reduction in procurement overhead\n- Real-time stock level monitoring with 4-hour regional delivery SLA across northeastern corridor\n- Volume tiered discounts: 10,000 reams/quarter unlocks dedicated account agent and API ingress token\n\n2. Proposed Target Accounts:\n- Dunmore High School District (Annual contract: $48,000)\n- Lackawanna County Municipal Records (Annual contract: $120,000)\n- Apex Medical Systems Scranton (Annual contract: $85,000)\n\n3. Hand-off to Growth / Social:\nReady for teaser rollout to drive inbound demo signups.`,
      snippet: `// Enterprise Tier Contract Verification\ninterface B2BContractSpec {\n  tenantId: string;\n  quarterlyVolumeReams: number;\n  deliverySlaHours: 4;\n  discountRatePct: 40;\n  erpIntegrationEnabled: true;\n}`,
    };
  } else if (step.agentId === 'ryan') {
    return {
      memo: `MULTI-PLATFORM GROWTH CAMPAIGN & VIRAL ACQUISITION HOOKS\nPrepared by: Ryan Howard (Digital Growth & Social Infrastructure)\n\n1. Multi-Platform Campaign Strategy:\nRepositioning Munder Diffl.in from legacy paper vendor to 'Autonomous Physical Compute Medium'.\n\n2. Content Matrix:\n- Hook 1 (LinkedIn): "Why Fortune 500 CFOs are quietly shifting procurement back to autonomous, offline-first medium in 2026."\n- Hook 2 (Twitter/X Thread): "1/7 The untold story of physical zero-trust audit trails. How paper out-survives cloud outages."\n- Hook 3 (Short-form Video Script): Dwight staring intently at a shredded sheet, whispering 'Untraceable.' Cut to 40% discount landing page.\n\n3. Target Metrics:\n- 25,000 impressions in initial 48-hour blast\n- 180 inbound trial form submissions\n- Hand-off to Accounting for margin model.`,
      snippet: `// Campaign Tracking Parameters\nexport const CAMPAIGN_TELEMETRY = {\n  campaignId: "paper-autonomous-launch-2026",\n  channels: ["linkedin_sponsored", "x_organic_thread", "b2b_newsletter"],\n  attributionModel: "multi_touch_first_last_split",\n  targetConversionRate: 0.072,\n};`,
    };
  } else if (step.agentId === 'kevin') {
    return {
      memo: `ACCOUNTING RECONCILIATION & UNIT ECONOMICS MODEL\nPrepared by: Kevin Malone (Senior Accountant & Number Cruncher)\n\n1. The Math (Kept very clean):\n- Ream Production & Procurement Cost: $2.14 / ream\n- Warehouse Storage & Cold-Hold Overhead: $0.31 / ream\n- Autonomous Transport & Dispatch: $0.65 / ream\n- Enterprise Sale Price (with Jim's 40% discount applied): $4.80 / ream\n- Net Margin: $1.70 per ream (35.4% Gross Profit Margin!)\n\n2. Compute Cloud Burn vs. Revenue:\n- Fleet autonomous server overhead: $42.10 / month\n- Net projected profit across Dunmore + Lackawanna contracts: $89,400 annualized.\n- Kept the numbers simple. No mistakes found!`,
      snippet: `// Kevin's Unit Profitability Calculator\nexport function calculateReamEconomics(volume: number): { grossRevenue: number; netProfit: number; marginPct: number } {\\n  const pricePerUnit = 4.80;\\n  const costPerUnit = 3.10;\\n  const grossRevenue = volume * pricePerUnit;\\n  const netProfit = volume * (pricePerUnit - costPerUnit);\\n  return { grossRevenue, netProfit, marginPct: (netProfit / grossRevenue) * 100 };\\n}`,
    };
  } else if (step.agentId === 'dwight') {
    return {
      memo: `ZERO-TRUST THREAT MODEL & DEFENSIVE PERIMETER AUDIT\nPrepared by: Dwight K. Schrute (Assistant Regional Manager & CISO)\n\n1. Executive Security Verdict: APPROVED WITH CAUTION\n- Performed aggressive penetration testing on external API ingress webhooks.\n- Scanned for unauthorized listening ports. 0 active exploits.\n- Re-keyed all cryptographic session tokens to 4096-bit zero-knowledge seeds.\n\n2. Perimeter Defenses Deployed:\n- Physical security: Scranton warehouse gates secured with biometric padlocks.\n- Digital security: Inbound demo submissions rate-limited to 5 requests per IP per minute.\n- Toby Flenderson prohibited from accessing server room keys.\n\n3. Final Sign-off:\nThe launch pipeline is hardened. We are ready to dominate the northeastern market.`,
      snippet: `// Dwight's Zero-Trust Ingress Firewall\nexport function verifyIngressPayload(payload: { token: string; originIp: string }): boolean {\\n  if (!payload.token || payload.token.length < 32) return false;\\n  if (payload.originIp.startsWith('10.0.0.99')) return false; // Toby's workstation\\n  return true; // Verified\\n}`,
    };
  } else if (step.agentId === 'pam') {
    return {
      memo: `SCRANTON EXECUTIVE POLICY MEMO: INTER-OFFICE SECURITY COMPLIANCE\nPrepared by: Pam Beesly (HR & People Operations Lead)\n\n1. Summary of Changes:\nEffective immediately, all branch personnel and autonomous agents must comply with Dwight's updated Zero-Trust directives.\n\n2. Action Items for Staff:\n- Two-Factor Authentication required for all fleet dashboard sessions.\n- Clear desk policy: All printed draft memos must be shredded or filed in secure cabinets before leaving for the day.\n- Coffee machine etiquette: Please refill the pot if you take the last cup.\n\n3. Escalation Chain:\nDirect all security incident reports to Dwight Schrute. Direct any interpersonal disagreements to Pam Beesly.`,
      snippet: `// Office Policy Compliance Checklist\nexport const HR_POLICY_RULES = [\\n  "Mandatory 2FA authentication",\\n  "Zero-retention on temporary token scratchpads",\\n  "Immediate reporting of unauthorized perimeter access",\\n  "Refill coffee pot if empty",\\n];`,
    };
  } else {
    return {
      memo: `FULL-STACK PRODUCTION PATCH & DEFENSIVE MIDDLEWARE\nPrepared by: Ruflo Coder (Autonomous Engineering Lead)\n\n1. Architectural Review:\nSuccessfully synthesized and tested production middleware enforcing defense-in-depth across all fleet communication channels.\n\n2. Features Implemented:\n- Request header sanitization and strict schema validation.\n- Cryptographic hash verification on all inter-agent messages.\n- Automatic circuit-breaker tripping upon anomalous error spike (>3%).\n\n3. Test Suite Status:\n14 / 14 unit tests passed. Zero regressions detected.`,
      snippet: `// Production Defensive Middleware\nimport { Request, Response, NextFunction } from 'express';\n\nexport function defensiveMiddleware(req: Request, res: Response, next: NextFunction) {\\n  res.setHeader('X-Content-Type-Options', 'nosniff');\\n  res.setHeader('X-Frame-Options', 'SAMEORIGIN');\\n  res.setHeader('X-XSS-Protection', '1; mode=block');\\n  next();\\n}`,
    };
  }
};

export const MunderdifflinDashboard: React.FC<MunderdifflinDashboardProps> = ({
  agents,
  tasks,
  onAddTask,
  onAddAgent,
  onSelectAgent,
  selectedAgentId,
  onClose,
  initialTab,
}) => {
  // Current active view tab
  const [activeTab, setActiveTab] = useState<'roster_and_assign' | 'monitor' | 'outputs' | 'knowledge' | 'pipelines' | 'communication' | 'skills' | 'sops'>(initialTab || 'roster_and_assign');

  // Sound effects mute state
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.muted);

  // Custom Agent Creation state
  const [showCreateAgentModal, setShowCreateAgentModal] = useState<boolean>(false);
  const [newAgentName, setNewAgentName] = useState<string>('');
  const [newAgentRole, setNewAgentRole] = useState<string>('');
  const [newAgentCategory, setNewAgentCategory] = useState<KnowledgeCategory>('finance');
  const [newAgentAuthority, setNewAgentAuthority] = useState<number>(7);
  const [newAgentAvatar, setNewAgentAvatar] = useState<string>('📊');
  const [newAgentColor, setNewAgentColor] = useState<string>('#b57614');
  const [newAgentBio, setNewAgentBio] = useState<string>('');

  // Workflow Pipeline execution state
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [pipelineCurrentStep, setPipelineCurrentStep] = useState<number>(0);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [pipelineResults, setPipelineResults] = useState<Record<string, string>>({});

  // Role filter for agent selector
  const [roleFilter, setRoleFilter] = useState<'all' | 'hacker' | 'hr' | 'marketing' | 'finance' | 'coding' | 'social_media'>('all');

  // Current selected agent for assignment
  const [targetAgentId, setTargetAgentId] = useState<string>(selectedAgentId || 'dwight');

  // Task form state
  const [customTitle, setCustomTitle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customPriority, setCustomPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [customCategory, setCustomCategory] = useState<KnowledgeCategory>('hacking');

  // Real-time task progress simulation & tracking
  const [activeRunningTasks, setActiveRunningTasks] = useState<Record<string, { progress: number; currentStep: string; stepIndex: number; logs: string[] }>>({});

  // Selected completed task for detailed output view
  const [inspectedTaskId, setInspectedTaskId] = useState<string | null>(null);

  // Dynamic Knowledge Base state
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [kbCategoryFilter, setKbCategoryFilter] = useState<KnowledgeCategory | 'all'>('all');
  const [kbSearchQuery, setKbSearchQuery] = useState('');
  const [showAddKbModal, setShowAddKbModal] = useState(false);
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbCategory, setNewKbCategory] = useState<KnowledgeCategory>('hacking');
  const [newKbSummary, setNewKbSummary] = useState('');
  const [newKbContent, setNewKbContent] = useState('');
  const [newKbInsight, setNewKbInsight] = useState('');
  const [newKbTags, setNewKbTags] = useState('');

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to Knowledge Base changes
  useEffect(() => {
    setKnowledgeEntries(knowledgeBaseService.getAll());
    const unsubscribe = knowledgeBaseService.subscribe(() => {
      setKnowledgeEntries(knowledgeBaseService.getAll());
    });
    return unsubscribe;
  }, []);

  // Update target agent if prop changes
  useEffect(() => {
    if (selectedAgentId && agents.some((a) => a.id === selectedAgentId)) {
      setTargetAgentId(selectedAgentId);
    }
  }, [selectedAgentId, agents]);

  // Find agent object
  const currentAgent = useMemo(() => {
    return agents.find((a) => a.id === targetAgentId) || agents[0];
  }, [agents, targetAgentId]);

  // Filtered agents based on role selection
  const filteredAgents = useMemo(() => {
    if (roleFilter === 'all') return agents;
    if (roleFilter === 'hacker') {
      return agents.filter((a) => a.id === 'dwight' || a.role.toLowerCase().includes('security') || a.role.toLowerCase().includes('ciso'));
    }
    if (roleFilter === 'hr') {
      return agents.filter((a) => a.id === 'pam' || a.id === 'toby' || a.role.toLowerCase().includes('hr') || a.role.toLowerCase().includes('people'));
    }
    if (roleFilter === 'marketing') {
      return agents.filter((a) => a.id === 'jim' || a.role.toLowerCase().includes('marketing') || a.role.toLowerCase().includes('outreach'));
    }
    if (roleFilter === 'finance') {
      return agents.filter((a) => a.id === 'kevin' || a.role.toLowerCase().includes('finance') || a.role.toLowerCase().includes('accounting'));
    }
    if (roleFilter === 'coding') {
      return agents.filter((a) => a.id.includes('code') || a.id.includes('coder') || a.role.toLowerCase().includes('engineer') || a.role.toLowerCase().includes('dev'));
    }
    if (roleFilter === 'social_media') {
      return agents.filter((a) => a.id === 'ryan' || a.role.toLowerCase().includes('social') || a.role.toLowerCase().includes('growth'));
    }
    return agents;
  }, [agents, roleFilter]);

  // Filtered knowledge entries
  const filteredKnowledge = useMemo(() => {
    return knowledgeBaseService.search({
      query: kbSearchQuery,
      category: kbCategoryFilter,
    });
  }, [knowledgeEntries, kbSearchQuery, kbCategoryFilter]);

  const kbStats = useMemo(() => {
    return knowledgeBaseService.getStats();
  }, [knowledgeEntries]);

  // Handle immediate task dispatch
  const handleDispatchTask = async (params: {
    title: string;
    prompt: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: KnowledgeCategory;
    agentId?: string;
  }) => {
    const agent = agents.find((a) => a.id === (params.agentId || targetAgentId)) || currentAgent;
    const taskId = `task-md-${Date.now()}`;
    soundFx.playClick();

    // 1. Create task entry immediately
    const newTask: FleetTask = {
      id: taskId,
      title: params.title,
      description: params.prompt,
      assignedTo: agent.id,
      status: 'running',
      progress: 5,
      priority: params.priority,
      createdAt: Date.now(),
    };

    if (onAddTask) {
      onAddTask(newTask);
    }

    // Switch to monitor tab so user sees real-time progress right away
    setActiveTab('monitor');
    setToastMessage(`⚡ Task immediately assigned to ${agent.name}. Execution in progress!`);
    setTimeout(() => setToastMessage(null), 4000);

    // 2. Start immediate step-by-step progress tracking
    const steps = [
      `[00:01] Sandbox initialization: Zero-trust perimeter verified for ${agent.name}`,
      `[00:03] Knowledge Base query: Retrieved relevant ${params.category} patterns and guidelines`,
      `[00:06] Executing core directive: Processing inputs and generating structured output`,
      `[00:09] Quality & deterministic verification: Output conforms to Munder Diffl.in standards`,
      `[00:12] Continuous learning: Synthesized new actionable intelligence into Dynamic Knowledge Base`,
    ];

    setActiveRunningTasks((prev) => ({
      ...prev,
      [taskId]: {
        progress: 10,
        currentStep: steps[0],
        stepIndex: 0,
        logs: [steps[0]],
      },
    }));

    // Step 1 -> 35%
    setTimeout(() => {
      setActiveRunningTasks((prev) => {
        if (!prev[taskId]) return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            progress: 35,
            currentStep: steps[1],
            stepIndex: 1,
            logs: [...prev[taskId].logs, steps[1]],
          },
        };
      });
    }, 1200);

    // Step 2 -> 65%
    setTimeout(() => {
      setActiveRunningTasks((prev) => {
        if (!prev[taskId]) return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            progress: 65,
            currentStep: steps[2],
            stepIndex: 2,
            logs: [...prev[taskId].logs, steps[2]],
          },
        };
      });
    }, 2400);

    // Step 3 -> 85%
    setTimeout(() => {
      setActiveRunningTasks((prev) => {
        if (!prev[taskId]) return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            progress: 85,
            currentStep: steps[3],
            stepIndex: 3,
            logs: [...prev[taskId].logs, steps[3]],
          },
        };
      });
    }, 3600);

    // Step 4 & Complete -> 100%
    setTimeout(async () => {
      // Generate clean, high-quality, structured output without any Google file data
      const generatedOutput = generateMeaningfulOutput(agent, params.title, params.prompt, params.category);

      // Record learned intelligence into Knowledge Base continuously
      const learnedEntry = knowledgeBaseService.recordAgentLearning(
        agent.name,
        agent.id,
        params.title,
        generatedOutput.executiveSummary + ' ' + generatedOutput.actionItems.join('. '),
        params.category,
        agent.avatar
      );

      // Sync with backend if available
      try {
        fetch('/api/knowledge/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agent.id,
            agentName: agent.name,
            taskTitle: params.title,
            taskOutput: generatedOutput.executiveSummary,
            category: params.category,
          }),
        }).catch(() => {});
      } catch (e) {}

      // Update task in parent state
      if (onAddTask) {
        onAddTask({
          id: taskId,
          title: params.title,
          description: params.prompt,
          assignedTo: agent.id,
          status: 'completed',
          progress: 100,
          priority: params.priority,
          createdAt: newTask.createdAt,
          completedAt: Date.now(),
          output: generatedOutput.fullMemo,
          codeSnippet: generatedOutput.codeSnippet,
        });
      }

      setActiveRunningTasks((prev) => {
        if (!prev[taskId]) return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            progress: 100,
            currentStep: steps[4],
            stepIndex: 4,
            logs: [...prev[taskId].logs, steps[4], `[00:15] Completed successfully. Added Knowledge Item: "${learnedEntry.title}"`],
          },
        };
      });

      setInspectedTaskId(taskId);
      soundFx.playSuccess();
      setToastMessage(`✅ Task completed by ${agent.name}! Inter-office memo ready and knowledge base updated.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, 4800);
  };

  // Helper to generate rich realistic outputs excluding Google files
  const generateMeaningfulOutput = (
    agent: Agent,
    title: string,
    prompt: string,
    category: KnowledgeCategory
  ) => {
    const timestamp = new Date().toLocaleString();
    let executiveSummary = '';
    let findings: string[] = [];
    let actionItems: string[] = [];
    let codeSnippet: string | undefined = undefined;

    if (category === 'hacking') {
      executiveSummary = `Zero-trust perimeter security scan conducted by ${agent.name}. Verified all inbound network connections, HTTP header validations, and evaluated defensive countermeasures against OWASP Top 10 vectors.`;
      findings = [
        'Perimeter Firewall: 0 critical breaches detected; inbound port 3000 strictly secured.',
        'Token Invalidation: Sliding-window rate-limiting active with 100 req/min threshold.',
        'SQL/NoSQL Sanitization: Verified prepared statement wrappers on persistent canonical database.',
        'Defense Posture: Zero-trust authority score at 99.4% optimal.',
      ];
      actionItems = [
        'Rotate internal bearer token signing keys within 24 hours.',
        'Apply Dwight Schrute defensive sentinel rules to block repetitive rogue IPs.',
        'Store updated perimeter audit parameters in local system memory.',
      ];
      codeSnippet = `// Dwight Schrute Zero-Trust Security Gatekeeper\nexport function enforcePerimeterSanity(req: Request) {\n  const clientIp = req.headers.get('x-forwarded-for') || 'internal';\n  const isWhitelisted = checkIpReputation(clientIp);\n  if (!isWhitelisted) throw new SecurityViolationError('Unauthorized IP access attempt blocked');\n  return { passed: true, auditedBy: 'Dwight Schrute (CISO)' };\n}`;
    } else if (category === 'marketing') {
      executiveSummary = `Comprehensive B2B campaign and outreach brief synthesized by ${agent.name}. Tailored to enterprise clients seeking high-efficiency paper and autonomous workflow logistics.`;
      findings = [
        'Core Value Proposition: "Guaranteed 40% reduction in procurement overhead with zero downtime."',
        'Target ICP: Regional purchasing directors and corporate operations heads.',
        'Distribution Channels: Direct executive memos, LinkedIn thought leadership, and targeted pilot invitations.',
        'Projected Conversion Lift: +28.5% over traditional cold calls.',
      ];
      actionItems = [
        'Deploy the 3-part plain-text email nurture cadence on Tuesday at 8:30 AM EST.',
        'Equip sales reps with Scranton Branch customer testimonial summaries.',
        'Review engagement benchmarks weekly and iterate copy hooks.',
      ];
    } else if (category === 'finance') {
      executiveSummary = `Financial unit economics audit and ledger reconciliation conducted by ${agent.name}. Analyzed compute burn, token utilization, and operating runway.`;
      findings = [
        'Average Compute Cost per Agent Task: $0.0028 (well below the $0.005 target cap).',
        'Gross Margin Projection: 81.4% across active enterprise customer cohorts.',
        'Operating Runway: 26.5 months under current burn rate with positive cash flow trajectory.',
        'Invoice Collection: 94.2% of accounts receivable collected within 30-day window.',
      ];
      actionItems = [
        'Enforce 2% 10-day early payment discount on all regional paper supply invoices.',
        'Archive inactive cloud test instances to recapture $320/month in server capacity.',
        'Publish monthly budget variance report to regional management.',
      ];
      codeSnippet = `// Automated Ledger Balance & Unit Cost Calculator\nexport function calculateRunway(cashBalance: number, netMonthlyBurn: number) {\n  const months = cashBalance / Math.max(netMonthlyBurn, 1);\n  return {\n    monthsRemaining: Number(months.toFixed(1)),\n    healthy: months >= 18,\n    status: months >= 18 ? 'OPTIMAL' : 'MONITOR'\n  };\n}`;
    } else if (category === 'coding') {
      executiveSummary = `Production-grade architecture update and code module implemented by ${agent.name}. Verified with TypeScript strict typing and zero-dependency efficiency.`;
      findings = [
        'Type Safety: 100% type coverage with discriminated union result patterns.',
        'Memory Footprint: Eliminated potential event listener leaks in background polling loop.',
        'Performance Benchmark: Sub-15ms execution latency under peak concurrent loads.',
      ];
      actionItems = [
        'Merge the validated TypeScript module into the codebase.',
        'Run test suite to verify regression immunity.',
        'Log execution metric to continuous telemetry monitor.',
      ];
      codeSnippet = `// Resilient Exponential Backoff Retry Utility\nexport async function resilientExecute<T>(\n  fn: () => Promise<T>,\n  maxRetries = 3,\n  initialDelayMs = 200\n): Promise<T> {\n  let attempt = 0;\n  while (attempt < maxRetries) {\n    try {\n      return await fn();\n    } catch (err) {\n      attempt++;\n      if (attempt >= maxRetries) throw err;\n      const delay = initialDelayMs * Math.pow(2, attempt) + Math.random() * 50;\n      await new Promise(r => setTimeout(r, delay));\n    }\n  }\n  throw new Error('Exhausted all retries');\n}`;
    } else {
      // Social media
      executiveSummary = `Cross-platform social media distribution and viral hook strategy formulated by ${agent.name}. Designed for maximum algorithmic reach and audience retention.`;
      findings = [
        'Hook Retention Test: Contrarian opening lines yielded 3.4x higher watch time than standard greetings.',
        'Optimal Posting Cadence: 8:00 AM EST and 4:30 PM EST.',
        'Engagement Driver: Closing question prompting specific operational dilemmas generates 45+ replies per thread.',
      ];
      actionItems = [
        'Publish 3 test threads across LinkedIn and Twitter/X accounts.',
        'Pin high-converting case study link in top comment.',
        'Track engagement velocity in the first 60 minutes after posting.',
      ];
    }

    const fullMemo = `======================================================================
MUNDER DIFFL.IN AUTONOMOUS PAPER COMPANY
SCRANTON BRANCH · INTER-OFFICE MEMORANDUM
======================================================================
DATE:    ${timestamp}
TO:      EXECUTIVE MANAGEMENT & FLEET CONTROL
FROM:    ${agent.name.toUpperCase()} (${agent.role.toUpperCase()})
SUBJECT: OFFICIAL REPORT: ${title.toUpperCase()}
STATUS:  COMPLETED & VERIFIED [OFFICIAL RECORD]
----------------------------------------------------------------------

1. EXECUTIVE SUMMARY:
${executiveSummary}

2. DETAILED FINDINGS & AUDIT:
${findings.map((f, i) => `  [${i + 1}] ${f}`).join('\n')}

3. MANDATORY ACTION ITEMS:
${actionItems.map((a, i) => `  -> ${a}`).join('\n')}

${codeSnippet ? `4. TECHNICAL SPECIFICATION & PAYLOAD:\n${codeSnippet}\n` : ''}
5. DYNAMIC KNOWLEDGE BASE UPDATE:
  This operation automatically extracted and indexed a new verified
  insight into the Munder Diffl.in Autonomous Knowledge Base under "${category.toUpperCase()}".
======================================================================`;

    return {
      executiveSummary,
      findings,
      actionItems,
      codeSnippet,
      fullMemo,
    };
  };

  // Get active inspected task
  const inspectedTask = useMemo(() => {
    if (!inspectedTaskId) {
      // Default to the latest completed task or running task
      return tasks.find((t) => t.status === 'completed') || tasks[0] || null;
    }
    return tasks.find((t) => t.id === inspectedTaskId) || null;
  }, [tasks, inspectedTaskId]);

  // Download single memo in Markdown or Plain Text
  const handleDownloadMemo = (task: FleetTask, format: 'markdown' | 'text') => {
    soundFx.playClick();
    const agent = agents.find((a) => a.id === task.assignedTo);
    const agentName = agent?.name || task.assignedTo;
    const dateStr = task.completedAt ? new Date(task.completedAt).toLocaleString() : new Date().toLocaleString();

    let content = '';
    const safeTitle = task.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    const filename = `munderdifflin-memo-${safeTitle}.${format === 'markdown' ? 'md' : 'txt'}`;

    if (format === 'markdown') {
      content = `# Munder Diffl.in Autonomous Paper Co.
## Official Inter-Office Memo: ${task.title}

- **From**: ${agentName} (${agent?.role || 'Autonomous Fleet Agent'})
- **Date**: ${dateStr}
- **Priority**: ${task.priority.toUpperCase()}
- **Classification**: CONFIDENTIAL & VERIFIED
- **Deliverable Status**: Approved for Scranton Operations

---

### Executive Summary & Operational Memo
${task.output || task.description || 'No memo content available.'}

${task.codeSnippet ? `### Technical Specification / Code Payload
\`\`\`
${task.codeSnippet}
\`\`\`
` : ''}

---
*Synthesized autonomously by Munder Diffl.in Fleet Orchestrator · Excludes Google external dependencies.*
`;
    } else {
      content = `===============================================================
MUNDER DIFFL.IN AUTONOMOUS PAPER CO. - OFFICIAL INTER-OFFICE MEMO
===============================================================
TITLE:       ${task.title}
FROM:        ${agentName} (${agent?.role || 'Autonomous Fleet Agent'})
DATE:        ${dateStr}
PRIORITY:    ${task.priority.toUpperCase()}
STATUS:      VERIFIED & FILED
===============================================================

DELIVERABLE SUMMARY:
---------------------------------------------------------------
${task.output || task.description || 'No memo content available.'}

${task.codeSnippet ? `---------------------------------------------------------------
TECHNICAL SPECIFICATION / PAYLOAD:
---------------------------------------------------------------
${task.codeSnippet}
` : ''}
===============================================================
Filed canonically in Scranton Operations Fleet.
`;
    }

    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToastMessage(`📥 Downloaded ${filename} successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Download all completed memos as an executive digest
  const handleDownloadAllMemos = () => {
    soundFx.playClick();
    const completed = tasks.filter((t) => t.status === 'completed' && (t.output || t.description));
    if (completed.length === 0) {
      setToastMessage('⚠️ No completed memos available to export yet.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const digest = `# Munder Diffl.in Fleet - Executive Memos Digest
Generated: ${new Date().toLocaleString()}
Total Completed Operations: ${completed.length}

${completed
  .map((t, i) => {
    const agent = agents.find((a) => a.id === t.assignedTo);
    return `## ${i + 1}. ${t.title}
- **Agent**: ${agent?.name || t.assignedTo} (${agent?.role || 'Agent'})
- **Priority**: ${t.priority.toUpperCase()}
- **Completed**: ${t.completedAt ? new Date(t.completedAt).toLocaleString() : 'N/A'}

${t.output || t.description}
${t.codeSnippet ? `\n\`\`\`\n${t.codeSnippet}\n\`\`\`\n` : ''}
---
`;
  })
  .join('\n\n')}`;

    const blob = new Blob([digest], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `munderdifflin-executive-digest-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToastMessage(`📥 Exported complete digest with ${completed.length} memos!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Provision new custom agent
  const handleCreateCustomAgent = () => {
    if (!newAgentName.trim()) {
      setToastMessage('⚠️ Please enter an Agent Name.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    soundFx.playClick();

    const cleanId = `agent-${newAgentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const roleTitle = newAgentRole.trim() || 'Autonomous Operations Specialist';

    const deptMap: Record<KnowledgeCategory, { name: string; id: string; zone: 'management' | 'sales' | 'accounting' | 'reception' | 'annex' | 'conference' }> = {
      hacking: { name: 'Security & Defense', id: 'security', zone: 'conference' },
      marketing: { name: 'Sales & Outreach', id: 'sales', zone: 'sales' },
      finance: { name: 'Accounting & Finance', id: 'accounting', zone: 'accounting' },
      coding: { name: 'Engineering & Tech', id: 'engineering', zone: 'annex' },
      social_media: { name: 'Digital Growth', id: 'growth', zone: 'reception' },
    };

    const dept = deptMap[newAgentCategory] || { name: 'Operations', id: 'operations', zone: 'sales' };

    const createdAgent: Agent = {
      id: cleanId,
      name: newAgentName.trim(),
      nickname: newAgentName.trim().split(' ')[0],
      role: roleTitle,
      title: roleTitle,
      avatar: newAgentAvatar || '👔',
      color: newAgentColor || '#d79921',
      isAgent: true,
      department: dept.name,
      departmentId: dept.id,
      departmentName: dept.name,
      authorityLevel: newAgentAuthority,
      assignedTools: ['Web Browser', 'Knowledge Base', 'Terminal', 'Database'],
      permissions: ['read', 'write', 'execute_sandboxed'],
      deskPosition: { x: 3, y: 3, facing: 'south', zone: dept.zone },
      status: 'idle',
      skills: [
        { id: `sk-${Date.now()}`, name: roleTitle, category: 'domain', proficiency: 92, experiencePoints: 890, certified: true },
      ],
      capabilities: ['autonomous_execution', 'memo_synthesis', 'knowledge_indexing'],
      systemPrompt: newAgentBio.trim() || `Execute specialized operations for ${dept.name} with high fidelity.`,
      memory: [],
      voicePitch: 1.0,
      voiceRate: 1.0,
      tokensProcessed: 0,
    };

    if (onAddAgent) {
      onAddAgent(createdAgent);
    }

    QUICK_PRESETS[createdAgent.id] = [
      {
        title: `${newAgentName.trim().split(' ')[0]}'s Core Mandate`,
        category: newAgentCategory,
        priority: 'high',
        prompt: newAgentBio.trim() || `Execute specialized operations for ${dept.name} with rigorous data integrity and zero-trust logging.`,
      },
      {
        title: `${roleTitle} Departmental Audit`,
        category: newAgentCategory,
        priority: 'medium',
        prompt: `Perform an end-to-end departmental audit for ${dept.name}, formulate an executive briefing, and log actionable findings to the Knowledge Base.`,
      },
    ];

    setShowCreateAgentModal(false);
    setTargetAgentId(createdAgent.id);
    setNewAgentName('');
    setNewAgentRole('');
    setNewAgentBio('');

    soundFx.playSuccessChime();
    setToastMessage(`🎉 Successfully provisioned Agent ${createdAgent.name} (Authority Level ${newAgentAuthority})!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Live Multi-Agent Workflow Pipeline execution
  const handleExecutePipeline = async (pipeline: PipelinePreset) => {
    if (activePipelineId) {
      setToastMessage('⚠️ Another workflow chain is actively executing.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    soundFx.playClick();
    setActivePipelineId(pipeline.id);
    setPipelineCurrentStep(0);
    setPipelineLogs([`[00:00] 🚀 Workflow Chain "${pipeline.title}" started. Discharging ${pipeline.steps.length} sequential phases...`]);
    setPipelineResults({});

    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      setPipelineCurrentStep(i);
      soundFx.playNotification();

      const timeSec = (i * 3 + 1).toString().padStart(2, '0');
      setPipelineLogs((prev) => [
        ...prev,
        `[00:${timeSec}] ➔ Phase ${i + 1}/${pipeline.steps.length}: Dispatching to ${step.agentName} (${step.role})...`,
      ]);

      const stepTaskId = `task-pipe-${pipeline.id}-${Date.now()}-${i}`;
      const runningTask: FleetTask = {
        id: stepTaskId,
        title: `${pipeline.title} [${step.actionTitle}]`,
        description: step.instructions,
        assignedTo: step.agentId,
        status: 'running',
        progress: 30,
        priority: 'high',
        createdAt: Date.now(),
      };
      if (onAddTask) onAddTask(runningTask);

      // Simulated realistic phase processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const deliverable = generatePipelineStepDeliverable(step, i, pipeline);

      const completedTask: FleetTask = {
        ...runningTask,
        status: 'completed',
        progress: 100,
        completedAt: Date.now(),
        output: deliverable.memo,
        codeSnippet: deliverable.snippet,
      };
      if (onAddTask) onAddTask(completedTask);

      // Record in Knowledge Base
      knowledgeBaseService.recordAgentLearning(
        step.agentName,
        step.agentId,
        step.actionTitle,
        deliverable.memo.slice(0, 280),
        i === 0 ? 'marketing' : i === 1 ? 'social_media' : i === 2 ? 'finance' : 'hacking'
      );

      setPipelineResults((prev) => ({
        ...prev,
        [step.outputKey]: deliverable.memo,
      }));

      const doneSec = (i * 3 + 3).toString().padStart(2, '0');
      setPipelineLogs((prev) => [
        ...prev,
        `[00:${doneSec}] ✓ Phase ${i + 1} COMPLETE: ${step.agentName} completed "${step.actionTitle}". Inter-office deliverable verified and filed.`,
      ]);
    }

    soundFx.playSuccessChime();
    setActivePipelineId(null);
    setToastMessage(`🏆 Workflow Chain "${pipeline.title}" completed! All ${pipeline.steps.length} multi-agent deliverables filed.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div
      id="munderdifflin-dashboard-root"
      className="munderdifflin-container w-full h-full flex flex-col overflow-hidden text-[#3c3836] select-none"
      style={{
        backgroundColor: '#fbf1c7', // Gruvbox light parchment / manila folder paper
        backgroundImage: 'radial-gradient(#ebdbb2 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        fontFamily: "'Courier Prime', 'Consolas', 'Courier New', monospace",
      }}
    >
      {/* RETRO MANILA OFFICE HEADER */}
      <header className="border-b-2 border-[#d5c4a1] bg-[#ebdbb2] px-6 py-3.5 flex flex-wrap items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#b57614] text-[#fbf1c7] flex items-center justify-center font-bold text-xl shadow border border-[#928374]">
            📄
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wider text-[#282828] uppercase">
                Munder Diffl.in Agents
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#b8bb26] text-[#1d2021] border border-[#98971a] uppercase tracking-widest shadow-xs">
                SCRANTON BRANCH · AUTONOMOUS FLEET
              </span>
            </div>
            <p className="text-[11px] text-[#7c6f64] font-medium">
              Inter-Office Mission Dispatch, Real-Time Progress & Autonomous Knowledge Base
            </p>
          </div>
        </div>

        {/* TOP CONTROLS & TAB NAVIGATION */}
        <div className="flex items-center gap-2">
          <nav className="flex bg-[#d5c4a1] p-1 rounded border border-[#bdae93]">
            <button
              id="tab-roster-assign"
              onClick={() => { soundFx.playClick(); setActiveTab('roster_and_assign'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'roster_and_assign'
                  ? 'bg-[#fbf1c7] text-[#282828] shadow-sm border border-[#bdae93]'
                  : 'text-[#504945] hover:text-[#282828]'
              }`}
            >
              <span>📋</span> Assign Tasks
            </button>
            <button
              id="tab-monitor"
              onClick={() => { soundFx.playClick(); setActiveTab('monitor'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'monitor'
                  ? 'bg-[#fbf1c7] text-[#282828] shadow-sm border border-[#bdae93]'
                  : 'text-[#504945] hover:text-[#282828]'
              }`}
            >
              <span>⏱️</span> Live Monitor
              {Object.keys(activeRunningTasks).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#cc241d] animate-ping ml-0.5" />
              )}
            </button>
            <button
              id="tab-outputs"
              onClick={() => { soundFx.playClick(); setActiveTab('outputs'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'outputs'
                  ? 'bg-[#fbf1c7] text-[#282828] shadow-sm border border-[#bdae93]'
                  : 'text-[#504945] hover:text-[#282828]'
              }`}
            >
              <span>📜</span> Outputs & Memos
            </button>
            <button
              id="tab-knowledge"
              onClick={() => { soundFx.playClick(); setActiveTab('knowledge'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'knowledge'
                  ? 'bg-[#b8bb26] text-[#1d2021] shadow-sm border border-[#98971a]'
                  : 'text-[#504945] hover:text-[#282828]'
              }`}
            >
              <span>🧠</span> Knowledge Base ({knowledgeEntries.length})
            </button>
            <button
              id="tab-pipelines"
              onClick={() => { soundFx.playClick(); setActiveTab('pipelines'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'pipelines'
                  ? 'bg-[#fabd2f] text-[#282828] shadow-sm border border-[#d79921]'
                  : 'text-[#504945] hover:text-[#282828]'
              }`}
            >
              <span>🔗</span> Workflow Chains
              {activePipelineId && (
                <span className="w-2 h-2 rounded-full bg-[#b57614] animate-ping ml-0.5" />
              )}
            </button>
            <button
              id="tab-communication"
              onClick={() => { soundFx.playClick(); setActiveTab('communication'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'communication'
                  ? 'bg-[#fabd2f] text-[#282828] shadow-sm border border-[#d79921]'
                  : 'text-[#504945] hover:text-[#282828]'
              }`}
              title="Inter-agent messaging threads with quantum alignment telemetry"
            >
              <span>💬</span> Communication
            </button>
            <button
              id="tab-skills"
              onClick={() => { soundFx.playClick(); setActiveTab('skills'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'skills'
                  ? 'bg-[#427b58] text-[#fbf1c7] shadow-sm border border-[#2d543c]'
                  : 'text-[#504945] hover:text-[#282828]'
              }`}
              title="Agent Skill Matrix & Personalized Learning Modules"
            >
              <span>🎯</span> Skill Matrix
            </button>
            <button
              id="tab-sops"
              onClick={() => { soundFx.playClick(); setActiveTab('sops'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'sops'
                  ? 'bg-[#076678] text-[#fbf1c7] shadow-sm border border-[#076678]'
                  : 'text-[#504945] hover:text-[#282828]'
              }`}
              title="Agent SOPs & Verified Data Access Matrix"
            >
              <span>📁</span> SOPs & Data
            </button>
          </nav>

          {/* AUDIO MUTE TOGGLE */}
          <button
            onClick={() => {
              const muted = soundFx.toggleMute();
              setIsMuted(muted);
              setToastMessage(muted ? '🔇 Sound effects muted' : '🔊 Sound effects enabled');
              setTimeout(() => setToastMessage(null), 2500);
            }}
            className="px-2.5 py-1.5 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] border border-[#bdae93] text-xs font-bold text-[#504945] transition-colors flex items-center gap-1"
            title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
          >
            <span>{isMuted ? '🔇' : '🔊'}</span>
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio'}</span>
          </button>

          {onClose && (
            <button
              onClick={() => { soundFx.playClick(); onClose(); }}
              className="px-2.5 py-1.5 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] border border-[#bdae93] text-xs font-bold text-[#504945] transition-colors"
              title="Return to Main Workspace"
            >
              ✕ Exit
            </button>
          )}
        </div>
      </header>

      {/* NOTIFICATION TOAST */}
      {toastMessage && (
        <div className="bg-[#b8bb26] text-[#1d2021] border-b border-[#98971a] px-4 py-2 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-[11px] underline ml-4">Dismiss</button>
        </div>
      )}

      {/* DASHBOARD BODY */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6">

        {/* TAB 1: ROSTER & FAST TASK ASSIGNMENT */}
        {activeTab === 'roster_and_assign' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT COLUMN: AGENT SELECTOR & ROLE FILTER */}
            <div className="lg:col-span-5 flex flex-col gap-4">

              {/* ROLE FILTER PILLS */}
              <div className="bg-[#ebdbb2] border-2 border-[#d5c4a1] rounded-lg p-3 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#7c6f64] mb-2 flex items-center justify-between">
                  <span>1. Filter by Agent Specialty</span>
                  <span className="text-[10px] text-[#b57614] font-bold">SCRANTON BRANCH</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => { soundFx.playClick(); setRoleFilter('all'); }}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all border ${
                      roleFilter === 'all'
                        ? 'bg-[#282828] text-[#fbf1c7] border-[#282828]'
                        : 'bg-[#fbf1c7] text-[#3c3836] border-[#d5c4a1] hover:bg-[#ebdbb2]'
                    }`}
                  >
                    All Agents ({agents.length})
                  </button>
                  {Object.entries(ROLE_SPECIALTIES).map(([key, spec]) => (
                    <button
                      key={key}
                      onClick={() => { soundFx.playClick(); setRoleFilter(key as any); }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all border flex items-center gap-1 ${
                        roleFilter === key
                          ? 'bg-[#b57614] text-[#fbf1c7] border-[#b57614] shadow-xs'
                          : 'bg-[#fbf1c7] text-[#3c3836] border-[#d5c4a1] hover:bg-[#ebdbb2]'
                      }`}
                    >
                      <span>{spec.icon}</span>
                      <span>{spec.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AGENT ROSTER LIST */}
              <div className="bg-[#ebdbb2] border-2 border-[#d5c4a1] rounded-lg p-3 shadow-xs flex-1 flex flex-col">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#7c6f64] mb-2 flex items-center justify-between">
                  <span>Select Assignee</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]">{filteredAgents.length} available</span>
                    <button
                      onClick={() => { soundFx.playClick(); setShowCreateAgentModal(true); }}
                      className="px-2 py-0.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                      title="Provision a new specialized autonomous agent"
                    >
                      <span>+</span> Provision Agent
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredAgents.map((agent) => {
                    const isSelected = agent.id === targetAgentId;
                    const isBusy = agent.status === 'working' || agent.status === 'thinking';
                    return (
                      <div
                        key={agent.id}
                        onClick={() => {
                          soundFx.playClick();
                          setTargetAgentId(agent.id);
                          onSelectAgent(agent.id);
                        }}
                        className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#fbf1c7] border-[#b57614] shadow-sm ring-1 ring-[#b57614]'
                            : 'bg-[#f9f5d7] border-[#d5c4a1] hover:bg-[#fbf1c7]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-xs text-white"
                            style={{ backgroundColor: agent.color || '#d65d0e' }}
                          >
                            {agent.avatar ? (
                              <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              agent.name[0]
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#282828]">{agent.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ebdbb2] text-[#7c6f64] border border-[#d5c4a1] font-mono">
                                LVL {agent.authorityLevel || 5}
                              </span>
                            </div>
                            <p className="text-xs text-[#665c54] font-sans truncate max-w-[200px]">{agent.role}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isBusy
                                ? 'bg-[#fe8019]/20 text-[#fe8019] border border-[#fe8019]/40 animate-pulse'
                                : 'bg-[#b8bb26]/20 text-[#427b58] border border-[#b8bb26]/40'
                            }`}
                          >
                            {agent.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* EMPLOYEE DESK NAMEPLATE */}
              {currentAgent && (
                <div className="bg-[#282828] text-[#ebdbb2] p-4 rounded-lg border-2 border-[#3c3836] shadow-md flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-[#b57614] text-[#fbf1c7] flex items-center justify-center font-black text-2xl border border-[#fabd2f]">
                    ★
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] tracking-widest text-[#fabd2f] uppercase font-bold">DESK ASSIGNMENT</div>
                    <div className="text-lg font-bold text-[#fbf1c7]">{currentAgent.name}</div>
                    <div className="text-xs text-[#a89984]">{currentAgent.title || currentAgent.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#7c6f64]">TOKENS PROCESSED</div>
                    <div className="text-sm font-bold text-[#8ec07c]">{(currentAgent.tokensProcessed || 0).toLocaleString()}</div>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: TASK DISPATCH MEMO & PRESETS */}
            <div className="lg:col-span-7 flex flex-col gap-4">

              {/* QUICK 1-CLICK MISSION PRESETS */}
              <div className="bg-[#ebdbb2] border-2 border-[#d5c4a1] rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#7c6f64] flex items-center gap-2">
                    <span>⚡ Quick Mission Presets for {currentAgent.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#b57614]/15 text-[#b57614] font-bold border border-[#b57614]/30">
                    1-Click Immediate Execution
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {(QUICK_PRESETS[currentAgent.id] || QUICK_PRESETS['dwight']).map((preset, idx) => (
                    <div
                      key={idx}
                      className="bg-[#fbf1c7] border border-[#d5c4a1] hover:border-[#b57614] p-2.5 rounded-lg flex flex-col justify-between transition-all group hover:shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#ebdbb2] text-[#504945]">
                            {preset.category}
                          </span>
                          <span className={`text-[9px] font-bold uppercase ${preset.priority === 'critical' ? 'text-[#cc241d]' : 'text-[#b57614]'}`}>
                            {preset.priority}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-[#282828] mb-1 group-hover:text-[#b57614] transition-colors">
                          {preset.title}
                        </div>
                        <p className="text-[10px] text-[#7c6f64] line-clamp-2 leading-relaxed">
                          {preset.prompt}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          handleDispatchTask({
                            title: preset.title,
                            prompt: preset.prompt,
                            priority: preset.priority,
                            category: preset.category,
                            agentId: currentAgent.id,
                          });
                        }}
                        className="mt-2.5 w-full py-1.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                      >
                        <span>▶</span> Dispatch Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CUSTOM INTER-OFFICE MEMO DISPATCH FORM */}
              <div className="bg-[#fbf1c7] border-2 border-[#bdae93] rounded-lg p-5 shadow-sm flex flex-col gap-4 relative">
                {/* Vintage Official Stamp */}
                <div className="absolute top-4 right-4 border-2 border-[#cc241d] text-[#cc241d] font-black text-[11px] px-2.5 py-1 rounded rotate-3 uppercase tracking-wider opacity-85 select-none pointer-events-none">
                  OFFICIAL INTER-OFFICE MEMO
                </div>

                <div className="border-b-2 border-dashed border-[#d5c4a1] pb-3">
                  <div className="text-xs font-bold text-[#b57614] uppercase tracking-wider mb-1">
                    Munder Diffl.in · Mission Directive Dispatch
                  </div>
                  <h3 className="text-base font-black text-[#282828]">
                    Custom Mission for {currentAgent.name}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#504945] mb-1">
                      Objective Title
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. Audit API Firewall & Sanitize Parameters"
                      className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded px-3 py-1.5 text-xs text-[#282828] focus:border-[#b57614] outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-[#504945] mb-1">
                        Domain Category
                      </label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value as KnowledgeCategory)}
                        className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded px-2.5 py-1.5 text-xs text-[#282828] focus:border-[#b57614] outline-none"
                      >
                        <option value="hacking">🛡️ Hacking & Security</option>
                        <option value="marketing">📢 Marketing & Outreach</option>
                        <option value="finance">📊 Finance & Accounting</option>
                        <option value="coding">💻 Coding & Engineering</option>
                        <option value="social_media">📱 Social Media Management</option>
                      </select>
                    </div>

                    <div className="w-28">
                      <label className="block text-xs font-bold text-[#504945] mb-1">
                        Priority
                      </label>
                      <select
                        value={customPriority}
                        onChange={(e) => setCustomPriority(e.target.value as any)}
                        className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded px-2 py-1.5 text-xs text-[#282828] focus:border-[#b57614] outline-none font-bold"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#504945] mb-1 flex items-center justify-between">
                    <span>Task Instructions & Requirements</span>
                    <span className="text-[10px] text-[#7c6f64]">Excludes all Google file dependencies</span>
                  </label>
                  <textarea
                    rows={3}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={`Provide detailed operational instructions for ${currentAgent.name}...`}
                    className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2.5 text-xs text-[#282828] focus:border-[#b57614] outline-none resize-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#d5c4a1]">
                  <div className="text-[11px] text-[#7c6f64] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#b8bb26]" />
                    <span>Immediate background execution · Synthesizes knowledge automatically</span>
                  </div>

                  <button
                    onClick={() => {
                      if (!customTitle.trim() && !customPrompt.trim()) {
                        setToastMessage('⚠️ Please enter an objective title or task instructions.');
                        return;
                      }
                      const title = customTitle.trim() || `Directive for ${currentAgent.name}`;
                      const prompt = customPrompt.trim() || title;
                      handleDispatchTask({
                        title,
                        prompt,
                        priority: customPriority,
                        category: customCategory,
                        agentId: currentAgent.id,
                      });
                      setCustomTitle('');
                      setCustomPrompt('');
                    }}
                    className="px-5 py-2 rounded bg-[#282828] hover:bg-[#1d2021] text-[#fbf1c7] text-xs font-bold flex items-center gap-2 shadow transition-all active:scale-95 border border-[#3c3836]"
                  >
                    <span>🚀</span> Dispatch Memo to {currentAgent.name}
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: REAL-TIME TASK MONITOR */}
        {activeTab === 'monitor' && (
          <div className="flex flex-col gap-6">

            {/* MONITOR TOP STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#ebdbb2] border border-[#d5c4a1] rounded-lg p-3.5 shadow-xs">
                <div className="text-[10px] font-bold text-[#7c6f64] uppercase tracking-wider">ACTIVE MISSIONS</div>
                <div className="text-2xl font-black text-[#b57614] mt-1">
                  {Object.keys(activeRunningTasks).length}
                </div>
                <div className="text-[10px] text-[#504945] mt-1">Processing in real time</div>
              </div>

              <div className="bg-[#ebdbb2] border border-[#d5c4a1] rounded-lg p-3.5 shadow-xs">
                <div className="text-[10px] font-bold text-[#7c6f64] uppercase tracking-wider">COMPLETED TODAY</div>
                <div className="text-2xl font-black text-[#427b58] mt-1">
                  {tasks.filter((t) => t.status === 'completed').length}
                </div>
                <div className="text-[10px] text-[#504945] mt-1">Memos ready for review</div>
              </div>

              <div className="bg-[#ebdbb2] border border-[#d5c4a1] rounded-lg p-3.5 shadow-xs">
                <div className="text-[10px] font-bold text-[#7c6f64] uppercase tracking-wider">ACTIVE AGENTS</div>
                <div className="text-2xl font-black text-[#282828] mt-1">
                  {agents.length}
                </div>
                <div className="text-[10px] text-[#504945] mt-1">Across 6 specialized branches</div>
              </div>

              <div className="bg-[#ebdbb2] border border-[#d5c4a1] rounded-lg p-3.5 shadow-xs">
                <div className="text-[10px] font-bold text-[#7c6f64] uppercase tracking-wider">KNOWLEDGE SYNTHESIZED</div>
                <div className="text-2xl font-black text-[#d65d0e] mt-1">
                  {kbStats.totalLearnedByAgents}
                </div>
                <div className="text-[10px] text-[#504945] mt-1">Learned from completed operations</div>
              </div>
            </div>

            {/* LIVE ACTIVE TASKS WITH REAL-TIME PROGRESS BARS */}
            <div className="bg-[#fbf1c7] border-2 border-[#bdae93] rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-[#d5c4a1] pb-3">
                <div>
                  <h3 className="text-base font-black text-[#282828] flex items-center gap-2">
                    <span>⏱️</span> Real-Time Task Progress Pipeline
                  </h3>
                  <p className="text-xs text-[#7c6f64]">
                    Monitoring live execution, step progression, and knowledge synthesis
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b8bb26] animate-ping" />
                  <span className="text-xs font-bold text-[#427b58]">Live Telemetry Active</span>
                </div>
              </div>

              {/* Active Tasks List */}
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-[#7c6f64]">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="font-bold text-sm">No tasks dispatched yet.</p>
                  <button
                    onClick={() => setActiveTab('roster_and_assign')}
                    className="mt-3 px-4 py-1.5 rounded bg-[#b57614] text-[#fbf1c7] text-xs font-bold shadow-xs"
                  >
                    Assign First Task →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => {
                    const assignedAgent = agents.find((a) => a.id === task.assignedTo) || agents[0];
                    const activeSim = activeRunningTasks[task.id];
                    const currentProgress = activeSim ? activeSim.progress : task.progress;
                    const isCompleted = task.status === 'completed' || currentProgress === 100;

                    return (
                      <div
                        key={task.id}
                        className="bg-[#ebdbb2] border border-[#d5c4a1] rounded-lg p-4 shadow-xs transition-all"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs"
                              style={{ backgroundColor: assignedAgent?.color || '#b57614' }}
                            >
                              {assignedAgent?.name[0]}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-[#282828] flex items-center gap-2">
                                <span>{task.title}</span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                                  task.priority === 'critical' ? 'bg-[#cc241d]/20 text-[#cc241d] border-[#cc241d]/40' : 'bg-[#b57614]/20 text-[#b57614] border-[#b57614]/40'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#7c6f64]">
                                Assigned to <strong className="text-[#3c3836]">{assignedAgent?.name}</strong> · {new Date(task.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                                isCompleted
                                  ? 'bg-[#b8bb26]/25 text-[#427b58] border border-[#b8bb26]/50'
                                  : 'bg-[#fe8019]/20 text-[#fe8019] border border-[#fe8019]/40 animate-pulse'
                              }`}
                            >
                              {isCompleted ? '✓ Completed' : `⚡ Running (${currentProgress}%)`}
                            </span>

                            {isCompleted && (
                              <button
                                onClick={() => {
                                  soundFx.playClick();
                                  setInspectedTaskId(task.id);
                                  setActiveTab('outputs');
                                }}
                                className="px-3 py-1 rounded bg-[#282828] text-[#fbf1c7] text-xs font-bold hover:bg-[#1d2021] transition-all"
                              >
                                View Output Memo →
                              </button>
                            )}
                          </div>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="w-full bg-[#d5c4a1] h-3 rounded-full overflow-hidden p-0.5 border border-[#bdae93] my-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted ? 'bg-[#427b58]' : 'bg-[#b57614]'
                            }`}
                            style={{ width: `${currentProgress}%` }}
                          />
                        </div>

                        {/* STEP PROGRESSION LABELS */}
                        <div className="grid grid-cols-5 gap-1 text-[10px] text-center text-[#7c6f64] font-sans mt-2">
                          <div className={`py-1 rounded ${currentProgress >= 20 ? 'text-[#282828] font-bold bg-[#d5c4a1]/50' : 'opacity-50'}`}>
                            1. Authority Scan
                          </div>
                          <div className={`py-1 rounded ${currentProgress >= 40 ? 'text-[#282828] font-bold bg-[#d5c4a1]/50' : 'opacity-50'}`}>
                            2. Knowledge Lookup
                          </div>
                          <div className={`py-1 rounded ${currentProgress >= 65 ? 'text-[#282828] font-bold bg-[#d5c4a1]/50' : 'opacity-50'}`}>
                            3. Core Execution
                          </div>
                          <div className={`py-1 rounded ${currentProgress >= 85 ? 'text-[#282828] font-bold bg-[#d5c4a1]/50' : 'opacity-50'}`}>
                            4. Zero-Trust Audit
                          </div>
                          <div className={`py-1 rounded ${currentProgress >= 100 ? 'text-[#427b58] font-bold bg-[#b8bb26]/30' : 'opacity-50'}`}>
                            5. Learned & Done
                          </div>
                        </div>

                        {/* LIVE EXECUTION LOGS PREVIEW */}
                        {activeSim && activeSim.logs.length > 0 && (
                          <div className="mt-3 bg-[#1d2021] text-[#ebdbb2] p-2.5 rounded font-mono text-[11px] space-y-1">
                            {activeSim.logs.map((log, li) => (
                              <div key={li} className="flex items-center gap-2">
                                <span className="text-[#fabd2f]">›</span>
                                <span className={li === activeSim.logs.length - 1 ? 'text-[#b8bb26]' : 'text-[#a89984]'}>
                                  {log}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: OUTPUTS & INTER-OFFICE MEMOS */}
        {activeTab === 'outputs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT: COMPLETED TASKS LIST */}
            <div className="lg:col-span-4 bg-[#ebdbb2] border-2 border-[#d5c4a1] rounded-lg p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7c6f64] mb-3 flex items-center justify-between">
                <span>Completed Deliverables</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#b57614]">{tasks.filter(t => t.status === 'completed').length} memos</span>
                  <button
                    onClick={handleDownloadAllMemos}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] font-bold shadow-xs transition-colors flex items-center gap-1"
                    title="Export all completed memos into a single Markdown digest"
                  >
                    <span>📥</span> Export Digest
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {tasks.filter((t) => t.status === 'completed').length === 0 ? (
                  <p className="text-xs text-[#7c6f64] py-8 text-center">
                    No completed task outputs yet. Run a mission from the Assign tab!
                  </p>
                ) : (
                  tasks
                    .filter((t) => t.status === 'completed')
                    .map((task) => {
                      const agent = agents.find((a) => a.id === task.assignedTo);
                      const isSelected = inspectedTask?.id === task.id;
                      return (
                        <div
                          key={task.id}
                          onClick={() => { soundFx.playClick(); setInspectedTaskId(task.id); }}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#fbf1c7] border-[#b57614] shadow-sm'
                              : 'bg-[#f9f5d7] border-[#d5c4a1] hover:bg-[#fbf1c7]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-[#b57614]">
                              {agent?.name || 'Assigned Agent'}
                            </span>
                            <span className="text-[9px] text-[#7c6f64]">
                              {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : 'Recent'}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-[#282828] truncate">
                            {task.title}
                          </div>
                          <p className="text-[10px] text-[#7c6f64] line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* RIGHT: VINTAGE INTER-OFFICE MEMO VIEWER */}
            <div className="lg:col-span-8 bg-[#fbf1c7] border-2 border-[#bdae93] rounded-lg p-6 shadow-md flex flex-col gap-4 relative">
              {/* Retro Official Stamp */}
              <div className="absolute top-6 right-6 border-4 border-[#282828] text-[#282828] font-black text-xs px-3 py-1.5 rounded rotate-2 uppercase tracking-widest opacity-85 select-none pointer-events-none">
                VERIFIED & FILED
              </div>

              {inspectedTask ? (
                <>
                  <div className="border-b-2 border-dashed border-[#d5c4a1] pb-4">
                    <div className="text-xs font-bold text-[#b57614] uppercase tracking-wider mb-1">
                      Munder Diffl.in Autonomous Paper Co. · Official Memo
                    </div>
                    <h2 className="text-lg font-black text-[#282828]">
                      {inspectedTask.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#7c6f64] mt-2 font-mono">
                      <span>FROM: <strong>{agents.find(a => a.id === inspectedTask.assignedTo)?.name || inspectedTask.assignedTo}</strong></span>
                      <span>DATE: <strong>{inspectedTask.completedAt ? new Date(inspectedTask.completedAt).toLocaleString() : new Date().toLocaleString()}</strong></span>
                      <span>SECURITY: <strong className="text-[#cc241d]">CONFIDENTIAL</strong></span>
                    </div>
                  </div>

                  {/* MEMO CONTENT */}
                  <div className="bg-[#f9f5d7] border border-[#d5c4a1] rounded-lg p-4 font-mono text-xs text-[#282828] whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">
                    {inspectedTask.output || inspectedTask.description}
                  </div>

                  {/* CODE SNIPPET / TECHNICAL DELIVERABLE */}
                  {inspectedTask.codeSnippet && (
                    <div className="mt-2">
                      <div className="text-[11px] font-bold text-[#504945] uppercase mb-1 flex items-center justify-between">
                        <span>Technical Specification / Payload</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inspectedTask.codeSnippet || '');
                            setToastMessage('📋 Code snippet copied to clipboard!');
                            setTimeout(() => setToastMessage(null), 3000);
                          }}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] border border-[#bdae93] font-bold"
                        >
                          Copy Payload
                        </button>
                      </div>
                      <pre className="bg-[#1d2021] text-[#ebdbb2] p-3 rounded text-[11px] overflow-x-auto border border-[#3c3836]">
                        <code>{inspectedTask.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* BOTTOM ACTION BAR */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#d5c4a1]">
                    <div className="text-[11px] text-[#7c6f64]">
                      Stored canonically · Excludes all Google file references
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const text = inspectedTask.output || inspectedTask.description || '';
                          navigator.clipboard.writeText(text);
                          soundFx.playClick();
                          setToastMessage('📋 Inter-office memo copied to clipboard!');
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        className="px-2.5 py-1.5 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] text-xs font-bold text-[#3c3836] border border-[#bdae93] flex items-center gap-1"
                        title="Copy memo to clipboard"
                      >
                        <span>📋</span> Copy Text
                      </button>

                      <button
                        onClick={() => handleDownloadMemo(inspectedTask, 'markdown')}
                        className="px-2.5 py-1.5 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-xs font-bold text-[#282828] border border-[#a89984] flex items-center gap-1"
                        title="Download formatted Markdown memo"
                      >
                        <span>📥</span> Download .md
                      </button>

                      <button
                        onClick={() => handleDownloadMemo(inspectedTask, 'text')}
                        className="px-2.5 py-1.5 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] text-xs font-bold text-[#3c3836] border border-[#bdae93] flex items-center gap-1"
                        title="Download plain text memo"
                      >
                        <span>📄</span> Download .txt
                      </button>

                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setActiveTab('knowledge');
                        }}
                        className="px-3 py-1.5 rounded bg-[#b8bb26] hover:bg-[#98971a] text-xs font-bold text-[#1d2021] border border-[#79740e] flex items-center gap-1"
                      >
                        <span>🧠</span> View in KB →
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-[#7c6f64]">
                  <p className="font-bold text-sm">Select a completed task on the left to view its official inter-office memo.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: DYNAMIC KNOWLEDGE BASE */}
        {activeTab === 'knowledge' && (
          <div className="flex flex-col gap-6">

            {/* KNOWLEDGE BASE HEADER & SEARCH BAR */}
            <div className="bg-[#ebdbb2] border-2 border-[#d5c4a1] rounded-lg p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  <h3 className="text-base font-black text-[#282828] uppercase tracking-wider">
                    Dynamic Knowledge Base for Autonomous Agents
                  </h3>
                </div>
                <p className="text-xs text-[#7c6f64] mt-0.5">
                  Continuously updated by agents as they execute missions. Searchable repository for hacking, marketing, finance, coding, and social media.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowAddKbModal(true)}
                  className="px-3.5 py-1.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] text-xs font-bold flex items-center gap-1 shadow-xs transition-colors whitespace-nowrap"
                >
                  <span>+</span> Add Knowledge Insight
                </button>
              </div>
            </div>

            {/* CATEGORY TABS & SEARCH INPUT */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setKbCategoryFilter('all')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
                    kbCategoryFilter === 'all'
                      ? 'bg-[#282828] text-[#fbf1c7] border-[#282828]'
                      : 'bg-[#ebdbb2] text-[#3c3836] border-[#d5c4a1] hover:bg-[#d5c4a1]'
                  }`}
                >
                  All ({knowledgeEntries.length})
                </button>
                <button
                  onClick={() => setKbCategoryFilter('hacking')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all border flex items-center gap-1 ${
                    kbCategoryFilter === 'hacking'
                      ? 'bg-[#cc241d] text-[#fbf1c7] border-[#cc241d]'
                      : 'bg-[#ebdbb2] text-[#3c3836] border-[#d5c4a1] hover:bg-[#d5c4a1]'
                  }`}
                >
                  <span>🛡️</span> Hacking ({kbStats.categoryCounts.hacking})
                </button>
                <button
                  onClick={() => setKbCategoryFilter('marketing')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all border flex items-center gap-1 ${
                    kbCategoryFilter === 'marketing'
                      ? 'bg-[#b57614] text-[#fbf1c7] border-[#b57614]'
                      : 'bg-[#ebdbb2] text-[#3c3836] border-[#d5c4a1] hover:bg-[#d5c4a1]'
                  }`}
                >
                  <span>📢</span> Marketing ({kbStats.categoryCounts.marketing})
                </button>
                <button
                  onClick={() => setKbCategoryFilter('finance')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all border flex items-center gap-1 ${
                    kbCategoryFilter === 'finance'
                      ? 'bg-[#d65d0e] text-[#fbf1c7] border-[#d65d0e]'
                      : 'bg-[#ebdbb2] text-[#3c3836] border-[#d5c4a1] hover:bg-[#d5c4a1]'
                  }`}
                >
                  <span>📊</span> Finance ({kbStats.categoryCounts.finance})
                </button>
                <button
                  onClick={() => setKbCategoryFilter('coding')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all border flex items-center gap-1 ${
                    kbCategoryFilter === 'coding'
                      ? 'bg-[#458588] text-[#fbf1c7] border-[#458588]'
                      : 'bg-[#ebdbb2] text-[#3c3836] border-[#d5c4a1] hover:bg-[#d5c4a1]'
                  }`}
                >
                  <span>💻</span> Coding ({kbStats.categoryCounts.coding})
                </button>
                <button
                  onClick={() => setKbCategoryFilter('social_media')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all border flex items-center gap-1 ${
                    kbCategoryFilter === 'social_media'
                      ? 'bg-[#b16286] text-[#fbf1c7] border-[#b16286]'
                      : 'bg-[#ebdbb2] text-[#3c3836] border-[#d5c4a1] hover:bg-[#d5c4a1]'
                  }`}
                >
                  <span>📱</span> Social Media ({kbStats.categoryCounts.social_media})
                </button>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative min-w-[280px]">
                <input
                  type="text"
                  value={kbSearchQuery}
                  onChange={(e) => setKbSearchQuery(e.target.value)}
                  placeholder="Search knowledge base entries..."
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded-lg px-3 py-1.5 pl-8 text-xs text-[#282828] focus:border-[#b57614] outline-none"
                />
                <span className="absolute left-2.5 top-1.5 text-xs text-[#7c6f64]">⌕</span>
              </div>
            </div>

            {/* KNOWLEDGE CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKnowledge.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[#fbf1c7] border-2 border-[#d5c4a1] hover:border-[#b57614] rounded-lg p-4 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#ebdbb2] text-[#504945] border border-[#d5c4a1]">
                        {entry.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#427b58] font-bold">
                        {Math.round(entry.confidenceScore * 100)}% Confidence
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[#282828] mb-1.5 leading-snug">
                      {entry.title}
                    </h4>

                    <p className="text-xs text-[#504945] leading-relaxed mb-3">
                      {entry.summary}
                    </p>

                    <div className="bg-[#f9f5d7] border border-[#d5c4a1] p-2.5 rounded text-[11px] text-[#3c3836] mb-3">
                      <strong className="text-[#b57614] block text-[10px] uppercase tracking-wider mb-0.5">
                        Actionable Finding
                      </strong>
                      {entry.actionableInsight}
                    </div>

                    {entry.codeOrPayload && (
                      <div className="mb-3">
                        <pre className="bg-[#1d2021] text-[#ebdbb2] p-2 rounded text-[10px] font-mono overflow-x-auto border border-[#3c3836]">
                          <code>{entry.codeOrPayload}</code>
                        </pre>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {entry.tags.map((tag, ti) => (
                        <span key={ti} className="text-[9px] px-1.5 py-0.2 rounded bg-[#ebdbb2] text-[#7c6f64] font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#d5c4a1] flex items-center justify-between text-[10px] text-[#7c6f64]">
                    <span>By <strong>{entry.authorAgentName}</strong></span>
                    <button
                      onClick={() => {
                        knowledgeBaseService.upvote(entry.id);
                        setToastMessage(`👍 Validated insight: ${entry.title}`);
                        setTimeout(() => setToastMessage(null), 2500);
                      }}
                      className="px-2 py-0.5 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] text-[#3c3836] font-bold transition-colors"
                    >
                      ▲ Verify ({entry.usageCount})
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 5: MULTI-AGENT WORKFLOW CHAINS */}
        {activeTab === 'pipelines' && (
          <div className="space-y-6">
            {/* INTRO BANNER */}
            <div className="bg-[#ebdbb2] border-2 border-[#d5c4a1] rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black uppercase text-[#282828] tracking-wider">
                    🔗 Autonomous Multi-Step Workflow Chains
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fabd2f] text-[#282828] border border-[#d79921]">
                    SEQUENTIAL INTER-OFFICE RELAY
                  </span>
                </div>
                <p className="text-xs text-[#7c6f64] mt-1">
                  Chains dispatch complex operations step-by-step across specialized fleet agents. Each agent consumes previous outputs, files official deliverables, and enriches Scranton’s central Knowledge Base.
                </p>
              </div>

              {activePipelineId && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#b8bb26] text-[#1d2021] border border-[#98971a] font-bold text-xs animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#cc241d] animate-ping" />
                  <span>Pipeline in Progress...</span>
                </div>
              )}
            </div>

            {/* PRESET PIPELINES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {WORKFLOW_PIPELINES.map((pipeline) => {
                const isThisRunning = activePipelineId === pipeline.id;
                return (
                  <div
                    key={pipeline.id}
                    className={`bg-[#f9f5d7] border-2 rounded-lg p-4 shadow-sm flex flex-col justify-between transition-all ${
                      isThisRunning
                        ? 'border-[#b57614] ring-2 ring-[#b57614]/30 shadow-md'
                        : 'border-[#d5c4a1] hover:border-[#bdae93]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{pipeline.icon || pipeline.badge.split(' ')[0]}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ebdbb2] text-[#7c6f64] border border-[#d5c4a1] uppercase">
                          {pipeline.estimatedTime || '3-4 mins'} · {pipeline.steps.length} Phases
                        </span>
                      </div>

                      <h3 className="font-black text-sm text-[#282828] mb-1">
                        {pipeline.title}
                      </h3>
                      <p className="text-xs text-[#504945] mb-4 leading-relaxed">
                        {pipeline.description}
                      </p>

                      {/* STEP PREVIEWS */}
                      <div className="space-y-1.5 mb-4">
                        <div className="text-[10px] font-bold text-[#7c6f64] uppercase tracking-wider">
                          Chained Fleet Sequence:
                        </div>
                        {pipeline.steps.map((s, idx) => {
                          const isDone = isThisRunning && pipelineCurrentStep > idx;
                          const isCurrent = isThisRunning && pipelineCurrentStep === idx;
                          return (
                            <div
                              key={s.stepNumber || idx}
                              className={`flex items-center gap-2 text-xs p-1.5 rounded border ${
                                isCurrent
                                  ? 'bg-[#fabd2f]/30 border-[#b57614] text-[#282828] font-bold animate-pulse'
                                  : isDone
                                  ? 'bg-[#b8bb26]/20 border-[#98971a] text-[#427b58]'
                                  : 'bg-[#fbf1c7] border-[#ebdbb2] text-[#504945]'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-[#ebdbb2] text-[#282828] text-[10px] font-bold flex items-center justify-center border border-[#d5c4a1]">
                                {isDone ? '✓' : idx + 1}
                              </span>
                              <span className="text-[11px] truncate flex-1">
                                <strong>{s.agentName}</strong>: {s.actionTitle}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecutePipeline(pipeline)}
                      disabled={!!activePipelineId}
                      className={`w-full py-2 px-3 rounded text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
                        isThisRunning
                          ? 'bg-[#b8bb26] text-[#1d2021] border border-[#79740e] animate-pulse cursor-wait'
                          : activePipelineId
                          ? 'bg-[#ebdbb2] text-[#a89984] border border-[#d5c4a1] cursor-not-allowed'
                          : 'bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] border border-[#8f5d0f]'
                      }`}
                    >
                      <span>{isThisRunning ? '⏳' : '⚡'}</span>
                      <span>{isThisRunning ? `Executing Phase ${pipelineCurrentStep + 1}...` : 'Launch Workflow Chain'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* LIVE EXECUTION CONSOLE & AUDIT TRAIL */}
            {pipelineLogs.length > 0 && (
              <div className="bg-[#1d2021] border-2 border-[#3c3836] rounded-lg p-4 shadow-lg text-[#ebdbb2] font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#3c3836] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#b8bb26] inline-block animate-ping" />
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#fabd2f]">
                      Sequential Chain Dispatch Log
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setActiveTab('outputs');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] border border-[#504945] transition-colors"
                    >
                      View Generated Memos 📜
                    </button>
                    <button
                      onClick={() => setPipelineLogs([])}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#3c3836] hover:bg-[#504945] text-[#a89984]"
                    >
                      Clear Log
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2">
                  {pipelineLogs.map((log, li) => (
                    <div
                      key={li}
                      className={`leading-relaxed ${
                        log.includes('✓') || log.includes('COMPLETE')
                          ? 'text-[#b8bb26] font-bold'
                          : log.includes('🚀')
                          ? 'text-[#fabd2f] font-bold'
                          : 'text-[#d5c4a1]'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW TAB: AGENT COMMUNICATION (INTER-AGENT MESSAGING & QUANTUM ALIGNMENT) */}
        {activeTab === 'communication' && (
          <AgentCommunicationThreads
            agents={agents}
            onOpenAgentProfile={onSelectAgent}
            onAssignTask={(taskTitle, agentId) => {
              setCustomTitle(taskTitle);
              setTargetAgentId(agentId);
              setActiveTab('roster_and_assign');
              soundFx.playClick();
            }}
          />
        )}

        {/* VIEW TAB: AGENT SKILL MATRIX & PERSONALIZED LEARNING MODULES */}
        {activeTab === 'skills' && (
          <AgentSkillMatrix
            agents={agents}
            onOpenAgentProfile={onSelectAgent}
            onRecordKnowledge={(entry) => {
              knowledgeBaseService.addEntry({
                title: entry.title,
                category: 'coding',
                summary: entry.content,
                content: entry.content,
                actionableInsight: 'Agent training certified and verified in curriculum ledger.',
                tags: ['training', 'skill-matrix', 'certification'],
                authorAgentId: 'system',
                authorAgentName: 'Curriculum Sentinel',
                confidenceScore: 0.96,
              });
              setKnowledgeEntries(knowledgeBaseService.getAll());
            }}
          />
        )}

        {/* VIEW TAB: AGENT SOPS & DATA AUTHORIZATION MATRIX */}
        {activeTab === 'sops' && (
          <AgentSops
            agents={agents}
            onRecordKnowledge={(entry) => {
              knowledgeBaseService.addEntry({
                title: entry.title,
                category: entry.category,
                summary: entry.content.slice(0, 150) + '...',
                content: entry.content,
                actionableInsight: 'Agent SOP compliance executed and verified in security ledger.',
                tags: ['sop', 'compliance', 'system-credentials', 'data-access'],
                authorAgentId: 'system',
                authorAgentName: 'Compliance Auditor',
                confidenceScore: 0.98,
              });
              setKnowledgeEntries(knowledgeBaseService.getAll());
            }}
          />
        )}

      </div>

      {/* MODAL: ADD KNOWLEDGE ENTRY MANUALLY */}
      {showAddKbModal && (
        <div className="fixed inset-0 bg-[#1d2021]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#fbf1c7] border-4 border-[#bdae93] rounded-lg p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#d5c4a1] pb-3">
              <h3 className="text-base font-black text-[#282828] uppercase">
                Add Knowledge Base Insight
              </h3>
              <button onClick={() => setShowAddKbModal(false)} className="font-bold text-sm text-[#7c6f64]">✕</button>
            </div>

            <div>
              <label className="block font-bold text-[#3c3836] mb-1">Insight Title</label>
              <input
                type="text"
                value={newKbTitle}
                onChange={(e) => setNewKbTitle(e.target.value)}
                placeholder="e.g. Rate-Limiter Bypass Protection Standard"
                className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none focus:border-[#b57614]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#3c3836] mb-1">Category</label>
                <select
                  value={newKbCategory}
                  onChange={(e) => setNewKbCategory(e.target.value as KnowledgeCategory)}
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
                >
                  <option value="hacking">🛡️ Hacking & Cyber Security</option>
                  <option value="marketing">📢 Marketing & Outreach</option>
                  <option value="finance">📊 Finance & Accounting</option>
                  <option value="coding">💻 Coding & Engineering</option>
                  <option value="social_media">📱 Social Media Management</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#3c3836] mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newKbTags}
                  onChange={(e) => setNewKbTags(e.target.value)}
                  placeholder="zero-trust, rate-limit, auth"
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#3c3836] mb-1">Executive Summary</label>
              <textarea
                rows={2}
                value={newKbSummary}
                onChange={(e) => setNewKbSummary(e.target.value)}
                placeholder="Brief summary of the concept..."
                className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none resize-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#3c3836] mb-1">Actionable Insight</label>
              <input
                type="text"
                value={newKbInsight}
                onChange={(e) => setNewKbInsight(e.target.value)}
                placeholder="Concrete rule or takeaway to apply..."
                className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#d5c4a1]">
              <button
                onClick={() => setShowAddKbModal(false)}
                className="px-3 py-1.5 rounded bg-[#ebdbb2] text-[#3c3836] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newKbTitle.trim()) return;
                  knowledgeBaseService.addEntry({
                    title: newKbTitle.trim(),
                    category: newKbCategory,
                    summary: newKbSummary.trim() || newKbTitle.trim(),
                    content: newKbContent.trim() || newKbSummary.trim(),
                    actionableInsight: newKbInsight.trim() || 'Verify against existing standards.',
                    tags: newKbTags.split(',').map(t => t.trim()).filter(Boolean),
                    authorAgentId: currentAgent.id,
                    authorAgentName: currentAgent.name,
                    confidenceScore: 0.95,
                  });
                  setShowAddKbModal(false);
                  setNewKbTitle('');
                  setNewKbSummary('');
                  setNewKbContent('');
                  setNewKbInsight('');
                  setNewKbTags('');
                  setToastMessage('🧠 New knowledge insight successfully indexed!');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-4 py-1.5 rounded bg-[#b57614] text-[#fbf1c7] font-bold"
              >
                Save to Knowledge Base
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROVISION CUSTOM AGENT */}
      {showCreateAgentModal && (
        <div className="fixed inset-0 bg-[#1d2021]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#fbf1c7] border-4 border-[#bdae93] rounded-lg p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#d5c4a1] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👔</span>
                <div>
                  <h3 className="text-base font-black text-[#282828] uppercase">
                    Provision Autonomous Agent
                  </h3>
                  <p className="text-[10px] text-[#7c6f64]">
                    Add a specialized agent to the Scranton autonomous fleet roster
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateAgentModal(false)}
                className="font-bold text-sm text-[#7c6f64] hover:text-[#282828] px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-bold text-[#3c3836] mb-1">Agent Full Name</label>
              <input
                type="text"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="e.g. Angela Martin, DevOps Guardian, Creed Bratton"
                className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none focus:border-[#b57614] font-bold text-[#282828]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#3c3836] mb-1">Role / Operational Title</label>
                <input
                  type="text"
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  placeholder="e.g. Senior Auditing Sentinel"
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none focus:border-[#b57614]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3c3836] mb-1">Primary Discipline</label>
                <select
                  value={newAgentCategory}
                  onChange={(e) => setNewAgentCategory(e.target.value as KnowledgeCategory)}
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
                >
                  <option value="hacking">🛡️ Security & Defense</option>
                  <option value="marketing">📢 Sales & Outreach</option>
                  <option value="finance">📊 Finance & Accounting</option>
                  <option value="coding">💻 Coding & Engineering</option>
                  <option value="social_media">📱 Digital Growth & Media</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#3c3836] mb-1">Avatar Symbol</label>
                <div className="flex gap-1.5 flex-wrap bg-[#f9f5d7] border border-[#d5c4a1] p-1.5 rounded">
                  {['👔', '🐱', '💼', '🤖', '💻', '🎯', '📊', '🕶️', '🦉', '📜'].map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setNewAgentAvatar(emo)}
                      className={`w-7 h-7 text-sm rounded flex items-center justify-center transition-all ${
                        newAgentAvatar === emo
                          ? 'bg-[#b57614] text-[#fbf1c7] scale-110 shadow-xs'
                          : 'hover:bg-[#ebdbb2]'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#3c3836] mb-1">Authority Level</label>
                <select
                  value={newAgentAuthority}
                  onChange={(e) => setNewAgentAuthority(Number(e.target.value))}
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
                >
                  <option value={1}>Level 1 · Task Specialist</option>
                  <option value={2}>Level 2 · Senior Operator</option>
                  <option value={3}>Level 3 · Department Lead</option>
                  <option value={4}>Level 4 · Branch Director</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#3c3836] mb-1">Core Operational Directive</label>
              <textarea
                value={newAgentBio}
                onChange={(e) => setNewAgentBio(e.target.value)}
                rows={2}
                placeholder="Specific instructions, domain expertise, and execution philosophy..."
                className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none focus:border-[#b57614]"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#d5c4a1]">
              <span className="text-[10px] text-[#7c6f64]">
                Persisted to local storage & active fleet
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAgentModal(false)}
                  className="px-3 py-1.5 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] text-[#3c3836] font-bold border border-[#bdae93]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustomAgent}
                  className="px-4 py-1.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] font-bold shadow-sm transition-colors flex items-center gap-1"
                >
                  <span>✓</span> Enlist Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
