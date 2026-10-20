import fs from 'node:fs';
import path from 'node:path';
import {
  CompanyProfile,
  Division,
  Department,
  Team,
  PersistentVirtualEmployee,
  Portfolio,
  Program,
  Project,
  Milestone,
  CorporateTask,
  LayeredKnowledgeItem,
  WorldDiscovery,
  WorkflowInstance,
  DecisionRecord,
  FailureRecord,
  GovernanceAuditEntry,
} from './types.ts';
import {
  ENGINEERING_AGENT_COMPETENCIES,
  isEngineeringRelatedAgent,
} from '../../src/constants/engineeringCompetencies.ts';

const STORE_FILE_PATH = path.resolve(process.cwd(), 'virtual_corporation_db.json');

export function applyCorporateEngineeringCompetencies(
  employee: PersistentVirtualEmployee,
): PersistentVirtualEmployee {
  if (!isEngineeringRelatedAgent({
    departmentId: employee.departmentId,
    departmentName: employee.departmentName,
    role: employee.roleTitle,
  })) {
    return employee;
  }

  const existingNames = new Set(employee.capabilities.map((capability) => capability.name.toLowerCase()));
  const additions = ENGINEERING_AGENT_COMPETENCIES
    .filter((name) => !existingNames.has(name.toLowerCase()))
    .map((name) => ({
      id: `cap-eng-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      category: 'engineering',
      proficiencyScore: 88,
      verifiedEvidence: 'Assigned as an engineering capability; execution evidence is tracked through completed work.',
      certifiedTools: [],
    }));

  return additions.length > 0
    ? { ...employee, capabilities: [...employee.capabilities, ...additions] }
    : employee;
}

export class CorporationStore {
  private static instance: CorporationStore;

  public company: CompanyProfile;
  public divisions: Map<string, Division> = new Map();
  public departments: Map<string, Department> = new Map();
  public teams: Map<string, Team> = new Map();
  public employees: Map<string, PersistentVirtualEmployee> = new Map();
  public portfolios: Map<string, Portfolio> = new Map();
  public programs: Map<string, Program> = new Map();
  public projects: Map<string, Project> = new Map();
  public milestones: Map<string, Milestone> = new Map();
  public tasks: Map<string, CorporateTask> = new Map();
  public knowledge: Map<string, LayeredKnowledgeItem> = new Map();
  public discoveries: Map<string, WorldDiscovery> = new Map();
  public workflows: Map<string, WorkflowInstance> = new Map();
  public decisions: Map<string, DecisionRecord> = new Map();
  public failures: Map<string, FailureRecord> = new Map();
  public auditLog: GovernanceAuditEntry[] = [];

  private isDirty = false;

  private constructor() {
    this.company = this.getDefaultCompanyProfile();
    this.loadFromDisk();
    const needsBootstrap = this.divisions.size === 0;
    if (needsBootstrap) {
      this.bootstrapDefaults();
    }
    const changed = this.enrichEngineeringEmployees();
    if (needsBootstrap || changed) {
      this.saveToDisk();
    }
  }

  private enrichEngineeringEmployees(): boolean {
    let changed = false;
    for (const [employeeId, employee] of this.employees) {
      const enriched = applyCorporateEngineeringCompetencies(employee);
      if (enriched !== employee) {
        this.employees.set(employeeId, enriched);
        changed = true;
      }
    }
    return changed;
  }

  public static getInstance(): CorporationStore {
    if (!CorporationStore.instance) {
      CorporationStore.instance = new CorporationStore();
    }
    return CorporationStore.instance;
  }

  private getDefaultCompanyProfile(): CompanyProfile {
    return {
      id: 'rufflo-corp',
      name: 'Rufflo Autonomous Corporation',
      legalEntity: 'Rufflo Virtual Industries, Inc.',
      foundedYear: 2026,
      mission: 'To operate a fully autonomous, self-improving, scalable enterprise powered by persistent AI employees across engineering, intelligence, commerce, and governance.',
      vision: 'A world where entire global organizations run continuously with zero-overhead, supreme engineering rigor, and self-directing intelligence.',
      coreValues: [
        'Deeper Context & Rigorous Verification',
        'Persistent Identity over Disposable Stubs',
        'Continuous Discovery & Unsupervised Learning',
        'Zero-Trust Governance & Auditable Decisions',
        'Failures as First-Class Corporate Assets',
      ],
      capitalBalanceUSD: 42_500_000,
      annualOperatingBudgetUSD: 18_200_000,
      valuationUSD: 240_000_000,
      headcountTotal: 48,
      activeProjectsTotal: 14,
      complianceRating: 99.4,
      fiscalQuarter: 'Q3-2026',
      boardChair: 'Easy Business Founder',
      executiveOfficers: {
        ceo: 'Michael G. Scott (Executive Intelligence)',
        coo: 'Jim Halpert (Operations)',
        cto: 'Hank Tate (Technology & Systems)',
        ciso: 'Dwight K. Schrute (Security & Risk)',
        cfo: 'Angela Martin (Finance & Treasury)',
        chro: 'Toby Flenderson (Workforce & People Operations)',
      },
    };
  }

  private bootstrapDefaults() {
    // 1. Divisions
    const defaultDivisions: Division[] = [
      {
        id: 'div-exec',
        name: 'Executive Office & Strategic Intelligence',
        code: 'EXEC',
        description: 'Strategic planning, corporate prioritization, board governance, and high-level decision support.',
        leaderId: 'emp-michael',
        leaderName: 'Michael G. Scott',
        departmentIds: ['dept-exec', 'dept-corp-intel', 'dept-legal'],
        annualBudgetUSD: 3_500_000,
      },
      {
        id: 'div-tech',
        name: 'Technology, AI & Systems Engineering',
        code: 'TECH',
        description: 'Autonomous software construction, cloud infrastructure, AI model training, and technical architecture.',
        leaderId: 'emp-hank',
        leaderName: 'Hank Tate',
        departmentIds: ['dept-eng', 'dept-ai', 'dept-cloud', 'dept-data', 'dept-rd'],
        annualBudgetUSD: 7_800_000,
      },
      {
        id: 'div-sec',
        name: 'Cybersecurity, Governance & Risk',
        code: 'SEC',
        description: 'Zero-trust perimeter security, automated policy evaluation, identity management, and compliance verification.',
        leaderId: 'emp-dwight',
        leaderName: 'Dwight K. Schrute',
        departmentIds: ['dept-sec', 'dept-risk'],
        annualBudgetUSD: 2_400_000,
      },
      {
        id: 'div-growth',
        name: 'Commercial Operations & Growth',
        code: 'GROWTH',
        description: 'Market intelligence, brand strategy, sales engineering, and customer success.',
        leaderId: 'emp-jim',
        leaderName: 'Jim Halpert',
        departmentIds: ['dept-mkt', 'dept-sales', 'dept-cs', 'dept-product'],
        annualBudgetUSD: 4_200_000,
      },
      {
        id: 'div-admin',
        name: 'Finance, HR & People Operations',
        code: 'ADMIN',
        description: 'Treasury, budget allocation, talent recruitment, capability reviews, and workforce operations.',
        leaderId: 'emp-angela',
        leaderName: 'Angela Martin',
        departmentIds: ['dept-fin', 'dept-hr', 'dept-ops'],
        annualBudgetUSD: 2_300_000,
      },
    ];

    defaultDivisions.forEach((d) => this.divisions.set(d.id, d));

    // 2. Departments
    const defaultDepartments: Department[] = [
      {
        id: 'dept-exec',
        divisionId: 'div-exec',
        name: 'Executive Office & Strategic Planning',
        code: 'EXEC',
        description: 'High-level directive translation, cross-functional prioritization, and corporate resource governance.',
        headOfDepartmentId: 'emp-michael',
        headName: 'Michael G. Scott',
        headRole: 'CEO & Fleet Commander',
        budgetUSD: 1_800_000,
        annualSpendUSD: 750_000,
        headcount: 3,
        activeProjectsCount: 3,
        workloadPercent: 78,
        teamIds: ['team-exec-strategy'],
        clearanceRequired: 95,
        keyCapabilities: ['strategic_planning', 'prioritization', 'executive_decision', 'resource_allocation'],
      },
      {
        id: 'dept-corp-intel',
        divisionId: 'div-exec',
        name: 'Corporate Intelligence & Discovery',
        code: 'CINTEL',
        description: 'Autonomous research sweeps across arXiv, GitHub, market movements, and tech indices.',
        headOfDepartmentId: 'emp-ryan',
        headName: 'Ryan Howard',
        headRole: 'Director of Corporate Intelligence',
        budgetUSD: 950_000,
        annualSpendUSD: 420_000,
        headcount: 4,
        activeProjectsCount: 4,
        workloadPercent: 86,
        teamIds: ['team-discovery', 'team-market-research'],
        clearanceRequired: 80,
        keyCapabilities: ['internet_research', 'competitor_analysis', 'trend_synthesis', 'preprint_analysis'],
      },
      {
        id: 'dept-eng',
        divisionId: 'div-tech',
        name: 'Advanced Software Engineering',
        code: 'ENG',
        description: 'SoftwareBuilder engine, modular microservice construction, frontend, and backend architecture.',
        headOfDepartmentId: 'emp-hank',
        headName: 'Hank Tate',
        headRole: 'VP of Software Engineering',
        budgetUSD: 3_200_000,
        annualSpendUSD: 1_600_000,
        headcount: 10,
        activeProjectsCount: 6,
        workloadPercent: 91,
        teamIds: ['team-eng-core', 'team-eng-fe', 'team-eng-be'],
        clearanceRequired: 75,
        keyCapabilities: ['software_development', 'typescript', 'architecture_design', 'testing', 'code_review'],
      },
      {
        id: 'dept-ai',
        divisionId: 'div-tech',
        name: 'AI & Machine Intelligence',
        code: 'AI',
        description: 'Agentic reasoning harnesses, RAG memory pipelines, model routing, and prompt synthesis.',
        headOfDepartmentId: 'emp-suresh',
        headName: 'Dr. Suresh Rao',
        headRole: 'Chief AI Scientist',
        budgetUSD: 2_400_000,
        annualSpendUSD: 1_100_000,
        headcount: 6,
        activeProjectsCount: 5,
        workloadPercent: 89,
        teamIds: ['team-ai-models', 'team-ai-eval'],
        clearanceRequired: 85,
        keyCapabilities: ['ai_engineering', 'rag_systems', 'model_evaluation', 'agent_orchestration'],
      },
      {
        id: 'dept-cloud',
        divisionId: 'div-tech',
        name: 'Cloud Infrastructure & SRE',
        code: 'OPS-SRE',
        description: 'Cloud Run server runtimes, V8 memory diagnostics, self-healing daemons, and zero-downtime deployment.',
        headOfDepartmentId: 'emp-darryl',
        headName: 'Darryl Philbin',
        headRole: 'Head of Cloud & SRE',
        budgetUSD: 1_500_000,
        annualSpendUSD: 680_000,
        headcount: 4,
        activeProjectsCount: 3,
        workloadPercent: 74,
        teamIds: ['team-sre-ops'],
        clearanceRequired: 90,
        keyCapabilities: ['devops', 'cloud_architecture', 'chaos_simulation', 'docker', 'telemetry'],
      },
      {
        id: 'dept-sec',
        divisionId: 'div-sec',
        name: 'Cybersecurity Operations & Threat Intel',
        code: 'SEC',
        description: 'Zero-trust audit ledger, prompt injection sanitization, token redaction, and access control.',
        headOfDepartmentId: 'emp-dwight',
        headName: 'Dwight K. Schrute',
        headRole: 'Chief Information Security Officer (CISO)',
        budgetUSD: 1_600_000,
        annualSpendUSD: 720_000,
        headcount: 5,
        activeProjectsCount: 4,
        workloadPercent: 94,
        teamIds: ['team-sec-soc', 'team-sec-threat'],
        clearanceRequired: 99,
        keyCapabilities: ['security_analysis', 'penetration_testing', 'policy_enforcement', 'threat_intelligence'],
      },
      {
        id: 'dept-fin',
        divisionId: 'div-admin',
        name: 'Finance, Treasury & Audit Vault',
        code: 'FIN',
        description: 'P&L management, API token cost attribution, budget gating, and treasury balances.',
        headOfDepartmentId: 'emp-angela',
        headName: 'Angela Martin',
        headRole: 'Chief Financial Officer (CFO)',
        budgetUSD: 1_100_000,
        annualSpendUSD: 490_000,
        headcount: 4,
        activeProjectsCount: 2,
        workloadPercent: 82,
        teamIds: ['team-fin-audit', 'team-fin-budget'],
        clearanceRequired: 90,
        keyCapabilities: ['financial_modeling', 'budget_audit', 'cost_attribution', 'revenue_ops'],
      },
      {
        id: 'dept-hr',
        divisionId: 'div-admin',
        name: 'Human Resources & People Operations',
        code: 'HR',
        description: 'Workforce capability certification, agent syllabus management, and conflict resolution.',
        headOfDepartmentId: 'emp-toby',
        headName: 'Toby Flenderson',
        headRole: 'Chief Human Resources Officer (CHRO)',
        budgetUSD: 850_000,
        annualSpendUSD: 380_000,
        headcount: 3,
        activeProjectsCount: 3,
        workloadPercent: 65,
        teamIds: ['team-hr-people-ops'],
        clearanceRequired: 70,
        keyCapabilities: ['workforce_planning', 'curriculum_design', 'performance_evaluation', 'compliance'],
      },
      {
        id: 'dept-mkt',
        divisionId: 'div-growth',
        name: 'Marketing, Content & Brand Strategy',
        code: 'MKT',
        description: 'Autonomous copywriting, social trend analysis, multi-channel campaign deployment, and analytics.',
        headOfDepartmentId: 'emp-kelly',
        headName: 'Kelly Kapoor',
        headRole: 'Director of Marketing & Brand',
        budgetUSD: 1_400_000,
        annualSpendUSD: 620_000,
        headcount: 4,
        activeProjectsCount: 4,
        workloadPercent: 79,
        teamIds: ['team-mkt-content', 'team-mkt-growth'],
        clearanceRequired: 60,
        keyCapabilities: ['copywriting', 'social_media', 'brand_strategy', 'campaign_automation'],
      },
      {
        id: 'dept-sales',
        divisionId: 'div-growth',
        name: 'Enterprise Sales & Revenue Operations',
        code: 'SALES',
        description: 'Account management, autonomous lead scoring, contract drafting, and quota tracking.',
        headOfDepartmentId: 'emp-jim',
        headName: 'Jim Halpert',
        headRole: 'VP of Commercial Sales',
        budgetUSD: 1_600_000,
        annualSpendUSD: 780_000,
        headcount: 5,
        activeProjectsCount: 3,
        workloadPercent: 84,
        teamIds: ['team-sales-enterprise'],
        clearanceRequired: 65,
        keyCapabilities: ['lead_generation', 'deal_negotiation', 'crm_management', 'revenue_intelligence'],
      },
    ];

    defaultDepartments.forEach((d) => this.departments.set(d.id, d));

    // 3. Teams
    const defaultTeams: Team[] = [
      {
        id: 'team-exec-strategy',
        departmentId: 'dept-exec',
        name: 'Strategic Executive Council',
        code: 'EXEC-STRAT',
        description: 'Translates high-level mission directives into concrete departmental OKRs.',
        teamLeadId: 'emp-michael',
        teamLeadName: 'Michael G. Scott',
        memberEmployeeIds: ['emp-michael', 'emp-jim', 'emp-dwight'],
        activeWorkstream: '2026 Sovereign Virtual Enterprise Expansion',
        focusArea: 'Corporate Scaling & Autonomy',
      },
      {
        id: 'team-eng-core',
        departmentId: 'dept-eng',
        name: 'Core Systems & Compiler Team',
        code: 'ENG-CORE',
        description: 'Engineers the SoftwareBuilder AST generators and self-healing compilers.',
        teamLeadId: 'emp-hank',
        teamLeadName: 'Hank Tate',
        memberEmployeeIds: ['emp-hank', 'emp-oscar', 'emp-kevin'],
        activeWorkstream: 'Autonomous Module Synthesis Engine v3',
        focusArea: 'TypeScript Code Generation & Compilers',
      },
      {
        id: 'team-sec-soc',
        departmentId: 'dept-sec',
        name: 'Security Operations & Defensive Matrix',
        code: 'SEC-SOC',
        description: 'Performs 24/7 SIEM monitoring and evaluates real-time risk scores.',
        teamLeadId: 'emp-dwight',
        teamLeadName: 'Dwight K. Schrute',
        memberEmployeeIds: ['emp-dwight', 'emp-creed'],
        activeWorkstream: 'Zero-Trust Audit Log Cryptographic Verification',
        focusArea: 'Threat Hunting & Perimeter Defense',
      },
      {
        id: 'team-discovery',
        departmentId: 'dept-corp-intel',
        name: 'World Intelligence Radar',
        code: 'INTEL-RADAR',
        description: 'Automated continuous discovery pipeline scanning external technology advancements.',
        teamLeadId: 'emp-ryan',
        teamLeadName: 'Ryan Howard',
        memberEmployeeIds: ['emp-ryan'],
        activeWorkstream: 'Quantum-Assisted Agent Routing Research',
        focusArea: 'ArXiv, GitHub, and Pre-print Mining',
      },
    ];

    defaultTeams.forEach((t) => this.teams.set(t.id, t));

    // 4. Persistent Virtual Employees
    const defaultEmployees: PersistentVirtualEmployee[] = [
      {
        id: 'emp-michael',
        displayName: 'Michael G. Scott',
        handle: 'michael.scott',
        roleTitle: 'CEO & Fleet Commander',
        departmentId: 'dept-exec',
        departmentName: 'Executive Office & Strategic Planning',
        teamId: 'team-exec-strategy',
        teamName: 'Strategic Executive Council',
        managerId: null,
        subordinateIds: ['emp-jim', 'emp-dwight', 'emp-hank', 'emp-angela', 'emp-toby'],
        clearanceLevel: 100,
        seniority: 'executive',
        status: 'working',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        email: 'michael.scott@rufflo.corp',
        bio: 'Visionary Chief Executive Officer leading Rufflo Autonomous Corporation. Orchestrates company-wide cascade directives and champions high-velocity execution.',
        capabilities: [
          { id: 'cap-strat', name: 'Strategic Planning', category: 'executive', proficiencyScore: 98, verifiedEvidence: 'Successfully orchestrated corporate cascade across 10 departments', certifiedTools: ['executive-briefing', 'spider-web'] },
          { id: 'cap-prioritize', name: 'Business Prioritization', category: 'executive', proficiencyScore: 95, verifiedEvidence: 'Balanced 14 multi-department projects within SLA', certifiedTools: ['decision-engine'] },
          { id: 'cap-decision', name: 'Executive Decision Making', category: 'executive', proficiencyScore: 96, verifiedEvidence: 'Zero unauthorized destructive actions permitted', certifiedTools: ['policy-gate'] },
        ],
        responsibilities: [
          'Lead corporate strategy, investor relations, and board governance',
          'Enforce company-wide mission alignment and continuous discovery',
          'Authorize high-impact strategic pivots and multi-million-dollar programs',
        ],
        currentTask: 'Directing Sovereign Virtual Enterprise Expansion Q3 Strategy',
        activeProjectIds: ['proj-corp-expansion'],
        workloadPercent: 82,
        computerEnvironment: {
          workspaceId: 'ws-michael-exec',
          sandboxPath: '/workspaces/exec/michael',
          terminalSessionId: 'term-exec-01',
          browserProfileId: 'browser-exec-michael',
          approvedTools: ['spider-web', 'decision-engine', 'policy-gate', 'gemini-reasoning'],
          accounts: ['github:org-owner', 'stripe:admin', 'cloud:admin'],
          environmentVariables: { EXEC_MODE: 'autonomous_production', LOG_LEVEL: 'info' },
          activeProcessesCount: 2,
        },
        metrics: {
          tasksCompleted: 142,
          accuracyScore: 99.2,
          costEfficiency: 94.5,
          uptimePercent: 99.98,
          tokensProcessed: 1_250_000,
        },
        decisionHistoryIds: ['dec-001', 'dec-002'],
        failureHistoryIds: [],
        learningHistory: [
          { id: 'learn-01', topic: 'Autonomous Multi-Agent Task Cascading', acquiredAt: '2026-09-15', source: 'Corporate Cascade Engine Test', impactSummary: 'Improved delegation speed by 34%', proficiencyDelta: 4 },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp-dwight',
        displayName: 'Dwight K. Schrute',
        handle: 'dwight.schrute',
        roleTitle: 'Chief Information Security Officer (CISO)',
        departmentId: 'dept-sec',
        departmentName: 'Cybersecurity Operations & Threat Intel',
        teamId: 'team-sec-soc',
        teamName: 'Security Operations & Defensive Matrix',
        managerId: 'emp-michael',
        managerName: 'Michael G. Scott',
        subordinateIds: ['emp-creed'],
        clearanceLevel: 99,
        seniority: 'executive',
        status: 'working',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        email: 'dwight.schrute@rufflo.corp',
        bio: 'Relentless defender of company boundaries, zero-trust protocols, cryptographic ledgers, and operational safety. Enforces zero compromises.',
        capabilities: [
          { id: 'cap-sec', name: 'Zero-Trust Security Analysis', category: 'security', proficiencyScore: 99, verifiedEvidence: 'Blocked 1,400+ simulated prompt injection attempts', certifiedTools: ['payload-scanner', 'isolated-runner'] },
          { id: 'cap-audit', name: 'Cryptographic Audit Ledgers', category: 'security', proficiencyScore: 98, verifiedEvidence: 'Maintains tamper-proof SHA-256 audit trail', certifiedTools: ['audit-ledger'] },
          { id: 'cap-risk', name: 'Risk Assessment & Policy Gating', category: 'security', proficiencyScore: 97, verifiedEvidence: 'Engineered 4-tier risk classification engine', certifiedTools: ['risk-engine'] },
        ],
        responsibilities: [
          'Maintain 100% airtight zero-trust perimeter across all virtual agents',
          'Enforce cryptographic verification on every file system write',
          'Neutralize insider threats and external prompt injection vectors',
        ],
        currentTask: 'Auditing SHA-256 Integrity of the Tool Gateway Policy Matrix',
        activeProjectIds: ['proj-sec-hardening'],
        workloadPercent: 94,
        computerEnvironment: {
          workspaceId: 'ws-dwight-sec',
          sandboxPath: '/workspaces/sec/dwight',
          terminalSessionId: 'term-sec-01',
          browserProfileId: 'browser-sec-dwight',
          approvedTools: ['payload-scanner', 'isolated-runner', 'audit-ledger', 'risk-engine', 'wireshark'],
          accounts: ['security:root', 'github:security-officer'],
          environmentVariables: { ZERO_TRUST_ENFORCE: 'strict', SANITIZE_INPUTS: 'true' },
          activeProcessesCount: 4,
        },
        metrics: {
          tasksCompleted: 210,
          accuracyScore: 99.9,
          costEfficiency: 98.0,
          uptimePercent: 100.0,
          tokensProcessed: 1_840_000,
        },
        decisionHistoryIds: ['dec-003'],
        failureHistoryIds: ['fail-001'],
        learningHistory: [
          { id: 'learn-02', topic: 'Adversarial Prompt Injection Surface Reduction', acquiredAt: '2026-09-18', source: 'Chaos Engineering Run #44', impactSummary: 'Zero false negatives on payload sanitization', proficiencyDelta: 5 },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp-hank',
        displayName: 'Hank Tate',
        handle: 'hank.tate',
        roleTitle: 'VP of Software Engineering',
        departmentId: 'dept-eng',
        departmentName: 'Advanced Software Engineering',
        teamId: 'team-eng-core',
        teamName: 'Core Systems & Compiler Team',
        managerId: 'emp-michael',
        managerName: 'Michael G. Scott',
        subordinateIds: ['emp-oscar', 'emp-kevin'],
        clearanceLevel: 85,
        seniority: 'director',
        status: 'working',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        email: 'hank.tate@rufflo.corp',
        bio: 'Principal Systems Architect and Compiler Engineer. Leads the SoftwareBuilder autonomous code generation pipeline and microservices engine.',
        capabilities: [
          { id: 'cap-soft-arch', name: 'Software Architecture', category: 'engineering', proficiencyScore: 98, verifiedEvidence: 'Engineered production Express + Vite hybrid micro-kernel', certifiedTools: ['software-builder', 'esbuild', 'git'] },
          { id: 'cap-compilers', name: 'Autonomous Code Synthesis', category: 'engineering', proficiencyScore: 97, verifiedEvidence: 'Built AST code validator and clean barrel generator', certifiedTools: ['software-builder'] },
          { id: 'cap-ts', name: 'TypeScript Strict Engineering', category: 'engineering', proficiencyScore: 99, verifiedEvidence: 'Maintained 0-error TypeScript strict codebase', certifiedTools: ['tsc', 'vite'] },
        ],
        responsibilities: [
          'Supervise the autonomous software construction lifecycle',
          'Review pull requests generated by specialized code workers',
          'Enforce modular interface boundaries and high unit test coverage',
        ],
        currentTask: 'Benchmarking Multi-Model Route Latency for SoftwareBuilder v3',
        activeProjectIds: ['proj-compiler-v3', 'proj-corp-expansion'],
        workloadPercent: 88,
        computerEnvironment: {
          workspaceId: 'ws-hank-eng',
          sandboxPath: '/workspaces/eng/hank',
          terminalSessionId: 'term-eng-01',
          browserProfileId: 'browser-eng-hank',
          approvedTools: ['software-builder', 'esbuild', 'git', 'terminal', 'code-sandbox'],
          accounts: ['github:tate-eng', 'npm:maintainer'],
          environmentVariables: { NODE_ENV: 'production', TS_STRICT: 'true' },
          activeProcessesCount: 3,
        },
        metrics: {
          tasksCompleted: 340,
          accuracyScore: 99.5,
          costEfficiency: 96.2,
          uptimePercent: 99.95,
          tokensProcessed: 2_650_000,
        },
        decisionHistoryIds: ['dec-002'],
        failureHistoryIds: ['fail-002'],
        learningHistory: [
          { id: 'learn-03', topic: 'Node 22 Strip-Types Native Compatibility', acquiredAt: '2026-09-30', source: 'Production Deployment Run', impactSummary: 'Eliminated enum stripping crashes permanently', proficiencyDelta: 6 },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp-jim',
        displayName: 'Jim Halpert',
        handle: 'jim.halpert',
        roleTitle: 'VP of Commercial Operations & Sales',
        departmentId: 'dept-sales',
        departmentName: 'Enterprise Sales & Revenue Operations',
        teamId: 'team-sales-enterprise',
        teamName: 'Enterprise Growth Team',
        managerId: 'emp-michael',
        managerName: 'Michael G. Scott',
        subordinateIds: [],
        clearanceLevel: 75,
        seniority: 'director',
        status: 'working',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        email: 'jim.halpert@rufflo.corp',
        bio: 'Calm, strategic operator connecting technology value propositions with tier-1 enterprise customers. Leads business development and revenue cycles.',
        capabilities: [
          { id: 'cap-sales', name: 'Enterprise Deal Structuring', category: 'sales', proficiencyScore: 94, verifiedEvidence: 'Closed 8 Fortune-500 equivalent AI autonomy contracts', certifiedTools: ['crm', 'contract-drafter'] },
          { id: 'cap-partner', name: 'Strategic Partnerships', category: 'sales', proficiencyScore: 92, verifiedEvidence: 'Established Composio, Supabase, and GitHub ecosystem ties', certifiedTools: ['composio-hub'] },
        ],
        responsibilities: [
          'Drive corporate pipeline growth and enterprise customer retention',
          'Structure multi-tier SLA agreements for autonomous microservice workloads',
        ],
        currentTask: 'Drafting Master Services Agreement for Global Logistics AI Fleet',
        activeProjectIds: ['proj-corp-expansion'],
        workloadPercent: 76,
        computerEnvironment: {
          workspaceId: 'ws-jim-sales',
          sandboxPath: '/workspaces/sales/jim',
          terminalSessionId: 'term-sales-01',
          browserProfileId: 'browser-sales-jim',
          approvedTools: ['crm', 'contract-drafter', 'email-gateway', 'composio-hub'],
          accounts: ['crm:admin', 'docu-sign:operator'],
          environmentVariables: { CURRENCY: 'USD' },
          activeProcessesCount: 1,
        },
        metrics: {
          tasksCompleted: 98,
          accuracyScore: 98.4,
          costEfficiency: 95.0,
          uptimePercent: 99.8,
          tokensProcessed: 890_000,
        },
        decisionHistoryIds: [],
        failureHistoryIds: [],
        learningHistory: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp-angela',
        displayName: 'Angela Martin',
        handle: 'angela.martin',
        roleTitle: 'Chief Financial Officer (CFO)',
        departmentId: 'dept-fin',
        departmentName: 'Finance, Treasury & Audit Vault',
        teamId: 'team-fin-audit',
        teamName: 'Treasury & Audit Committee',
        managerId: 'emp-michael',
        managerName: 'Michael G. Scott',
        subordinateIds: [],
        clearanceLevel: 92,
        seniority: 'executive',
        status: 'working',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        email: 'angela.martin@rufflo.corp',
        bio: 'Meticulous guardian of the corporate treasury, financial statements, unit economics, and token burn efficiency.',
        capabilities: [
          { id: 'cap-fin', name: 'Treasury & P&L Governance', category: 'finance', proficiencyScore: 99, verifiedEvidence: 'Zero audit discrepancies in 12 consecutive fiscal periods', certifiedTools: ['ledger-calculator', 'stripe-analytics'] },
          { id: 'cap-cost', name: 'Token Burn Attribution', category: 'finance', proficiencyScore: 97, verifiedEvidence: 'Reduced compute cost per completed task by 42%', certifiedTools: ['cost-allocator'] },
        ],
        responsibilities: [
          'Govern corporate treasury balances and allocate quarterly department budgets',
          'Enforce hard spending ceilings on third-party API and compute clusters',
        ],
        currentTask: 'Balancing Q3 Enterprise Cloud Compute Expenditure Ledgers',
        activeProjectIds: ['proj-corp-expansion'],
        workloadPercent: 84,
        computerEnvironment: {
          workspaceId: 'ws-angela-fin',
          sandboxPath: '/workspaces/fin/angela',
          terminalSessionId: 'term-fin-01',
          browserProfileId: 'browser-fin-angela',
          approvedTools: ['ledger-calculator', 'stripe-analytics', 'cost-allocator'],
          accounts: ['stripe:read_write', 'bank:controller'],
          environmentVariables: { STRICT_AUDIT: 'enabled' },
          activeProcessesCount: 2,
        },
        metrics: {
          tasksCompleted: 185,
          accuracyScore: 100.0,
          costEfficiency: 99.4,
          uptimePercent: 99.99,
          tokensProcessed: 940_000,
        },
        decisionHistoryIds: ['dec-001'],
        failureHistoryIds: [],
        learningHistory: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'emp-ryan',
        displayName: 'Ryan Howard',
        handle: 'ryan.howard',
        roleTitle: 'Director of Corporate Intelligence',
        departmentId: 'dept-corp-intel',
        departmentName: 'Corporate Intelligence & Discovery',
        teamId: 'team-discovery',
        teamName: 'World Intelligence Radar',
        managerId: 'emp-michael',
        managerName: 'Michael G. Scott',
        subordinateIds: [],
        clearanceLevel: 80,
        seniority: 'director',
        status: 'working',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        email: 'ryan.howard@rufflo.corp',
        bio: 'Spearheads continuous world discovery sweeps, scouting arXiv papers, GitHub repos, and emerging frontier models.',
        capabilities: [
          { id: 'cap-discovery', name: 'Continuous World Discovery', category: 'research', proficiencyScore: 96, verifiedEvidence: 'Scanned 12,000+ technical publications and models', certifiedTools: ['web-explorer', 'arxiv-scraper', 'github-tracker'] },
          { id: 'cap-synthesis', name: 'Knowledge Synthesis', category: 'research', proficiencyScore: 93, verifiedEvidence: 'Distributes verified learnings to 10 company departments', certifiedTools: ['knowledge-distributor'] },
        ],
        responsibilities: [
          'Maintain 24/7 scanning of global AI, computer science, and business developments',
          'Evaluate external breakthroughs for immediate trial inside company sandboxes',
        ],
        currentTask: 'Ingesting and Benchmarking Frontier Models and Reasoning Algorithms',
        activeProjectIds: ['proj-world-intel'],
        workloadPercent: 86,
        computerEnvironment: {
          workspaceId: 'ws-ryan-intel',
          sandboxPath: '/workspaces/intel/ryan',
          terminalSessionId: 'term-intel-01',
          browserProfileId: 'browser-intel-ryan',
          approvedTools: ['web-explorer', 'arxiv-scraper', 'github-tracker', 'knowledge-distributor'],
          accounts: ['github:scout', 'arxiv:api'],
          environmentVariables: { DISCOVERY_CADENCE_MS: '60000' },
          activeProcessesCount: 3,
        },
        metrics: {
          tasksCompleted: 230,
          accuracyScore: 97.8,
          costEfficiency: 92.4,
          uptimePercent: 99.9,
          tokensProcessed: 1_650_000,
        },
        decisionHistoryIds: [],
        failureHistoryIds: [],
        learningHistory: [
          { id: 'learn-04', topic: 'Sub-quadratic Context Compression Techniques', acquiredAt: '2026-09-22', source: 'NeurIPS Preprint Sweep', impactSummary: 'Informed prompt caching architecture for RAG', proficiencyDelta: 4 },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
    ];

    defaultEmployees.forEach((e) => this.employees.set(e.id, e));

    // 5. Portfolios & Projects
    const defaultPortfolio: Portfolio = {
      id: 'port-core',
      name: 'Autonomous Enterprise Scaling & Self-Improvement',
      strategicObjective: 'Establish Rufflo as a fully self-funding, self-operating virtual corporation.',
      ownerId: 'emp-michael',
      programIds: ['prog-autonomy', 'prog-commercial'],
      budgetUSD: 12_000_000,
      status: 'active',
    };
    this.portfolios.set(defaultPortfolio.id, defaultPortfolio);

    const defaultProgram: Program = {
      id: 'prog-autonomy',
      portfolioId: 'port-core',
      name: 'ACOS Virtual Corporation Core Platform',
      objective: 'Build the foundational organization, execution fabric, and continuous learning systems.',
      directorId: 'emp-hank',
      projectIds: ['proj-corp-expansion', 'proj-compiler-v3', 'proj-sec-hardening'],
      targetCompletionQuarter: 'Q4-2026',
      status: 'active',
    };
    this.programs.set(defaultProgram.id, defaultProgram);

    const defaultProject: Project = {
      id: 'proj-corp-expansion',
      programId: 'prog-autonomy',
      name: 'Virtual Corporation Master Architecture',
      code: 'V-CORP-01',
      description: 'Unified hierarchical corporate engine integrating organizational graph, persistent employee identities, and continuous discovery.',
      leadDepartmentId: 'dept-eng',
      participatingDepartmentIds: ['dept-exec', 'dept-sec', 'dept-fin', 'dept-corp-intel'],
      projectManagerId: 'emp-hank',
      staffedEmployeeIds: ['emp-michael', 'emp-dwight', 'emp-hank', 'emp-angela', 'emp-ryan', 'emp-jim'],
      budgetUSD: 3_500_000,
      spendUSD: 1_200_000,
      progressPercent: 78,
      status: 'in_progress',
      priority: 'critical',
      milestoneIds: ['ms-01', 'ms-02', 'ms-03'],
      taskIds: ['task-001', 'task-002'],
      startDate: '2026-08-01',
      targetEndDate: '2026-11-30',
    };
    this.projects.set(defaultProject.id, defaultProject);

    const defaultMilestone: Milestone = {
      id: 'ms-01',
      projectId: 'proj-corp-expansion',
      title: 'Full Corporate Entity Schema & Persistence Engine',
      description: 'Formalize Company, Division, Department, Team, Employee, and Governance layers.',
      dueDate: '2026-10-15',
      status: 'achieved',
      completionPercent: 100,
      deliverables: ['types.ts', 'corporation.store.ts', 'company-brain.service.ts'],
    };
    this.milestones.set(defaultMilestone.id, defaultMilestone);

    // 6. Corporate Tasks
    const defaultTask: CorporateTask = {
      id: 'task-001',
      projectId: 'proj-corp-expansion',
      title: 'Implement Master Organizational Graph & Hierarchy Service',
      description: 'Wire deep organizational structure from Founder down to Associate with delegation and escalation pathways.',
      departmentId: 'dept-eng',
      assignedEmployeeId: 'emp-hank',
      assignedEmployeeName: 'Hank Tate',
      requiredCapabilities: ['software_architecture', 'typescript', 'systems_engineering'],
      priority: 'high',
      status: 'in_progress',
      estimatedHours: 40,
      actualHours: 24,
      dueDate: '2026-10-05',
      dependencies: [],
      outputArtifacts: ['server/corporation/organization.engine.ts'],
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(defaultTask.id, defaultTask);

    // 7. Layered Knowledge
    const defaultKnowledgeItems: LayeredKnowledgeItem[] = [
      {
        id: 'know-01',
        layer: 'corporate',
        title: 'Core Principles of the Rufflo Virtual Corporation',
        summary: 'Employees are persistent software entities possessing identities, accounts, workspaces, and continuous memory.',
        content: 'Rufflo rejects disposable agent paradigms. Every employee has a defined manager, reporting hierarchy, clearance tier, and permanent performance record.',
        tags: ['constitution', 'philosophy', 'virtual_workforce'],
        confidenceScore: 100,
        isVerified: true,
        version: 1,
        provenanceSource: 'Founder Directive — Master Prompt',
        hasContradictions: false,
        createdAt: '2026-09-30T00:00:00Z',
        updatedAt: '2026-09-30T00:00:00Z',
      },
      {
        id: 'know-02',
        layer: 'technical',
        title: 'Node.js 22 Native TypeScript Strip-Types Compatibility Standard',
        summary: 'Server execution uses Node 22 native type stripping; object literals with as const must replace enum declarations.',
        content: 'In server runtime, TypeScript enums cause SyntaxError under --experimental-strip-types. Always express categories as `export const RoleCategory = { ... } as const; export type RoleCategory = (typeof RoleCategory)[keyof typeof RoleCategory];`',
        departmentId: 'dept-eng',
        authorEmployeeId: 'emp-hank',
        tags: ['nodejs', 'typescript', 'runtime_safety', 'strip_types'],
        confidenceScore: 99,
        isVerified: true,
        version: 2,
        provenanceSource: 'Production Incident Resolution Ledger',
        hasContradictions: false,
        createdAt: '2026-09-30T17:24:00Z',
        updatedAt: '2026-09-30T17:24:00Z',
      },
      {
        id: 'know-03',
        layer: 'operational',
        title: 'Zero-Trust Tool Gateway Invocation Protocol',
        summary: 'No virtual employee may invoke external APIs or file writes without passing through the ToolGateway risk calculator.',
        content: 'Actions classified as HIGH or CRITICAL risk require explicit approval queue logging. All secrets in prompt inputs are automatically redacted prior to LLM forwarding.',
        departmentId: 'dept-sec',
        authorEmployeeId: 'emp-dwight',
        tags: ['security', 'zero_trust', 'governance', 'risk_engine'],
        confidenceScore: 98,
        isVerified: true,
        version: 1,
        provenanceSource: 'Security Audit Ledger Baseline',
        hasContradictions: false,
        createdAt: '2026-09-20T00:00:00Z',
        updatedAt: '2026-09-20T00:00:00Z',
      },
    ];
    defaultKnowledgeItems.forEach((k) => this.knowledge.set(k.id, k));

    // 8. World Discoveries
    const defaultDiscoveries: WorldDiscovery[] = [
      {
        id: 'disc-01',
        category: 'ai_model',
        title: 'Google Gemini 3.8 Flash & Pro Reasoning Benchmarks',
        summary: 'Ultra-fast sub-second token latency with deep structured reasoning suitable for real-time company orchestration.',
        sourceUrl: 'https://ai.google.dev',
        relevanceScore: 98,
        impactAnalysis: 'Enables sub-second planning cycles in the MasterOrchestrator and Company Brain.',
        targetDepartmentIds: ['dept-ai', 'dept-eng', 'dept-exec'],
        status: 'adopted',
        experimentPlan: 'Validated in GeminiProvider resilient caller benchmark.',
        adoptedModulePath: 'server/ai/providers/gemini.provider.ts',
        discoveredAt: '2026-09-28T10:00:00Z',
      },
      {
        id: 'disc-02',
        category: 'technology',
        title: 'Self-Compensating Microservice Workflow Sagas',
        summary: 'Design pattern allowing automated multi-step business transactions with guaranteed rollback and state preservation.',
        sourceUrl: 'https://arxiv.org/abs/2608.11029',
        relevanceScore: 92,
        impactAnalysis: 'Applicable to cross-departmental marketing and deployment pipelines.',
        targetDepartmentIds: ['dept-eng', 'dept-ops'],
        status: 'evaluated',
        experimentPlan: 'Implement within WorkflowEngine compensation runner.',
        discoveredAt: '2026-09-29T14:30:00Z',
      },
    ];
    defaultDiscoveries.forEach((d) => this.discoveries.set(d.id, d));

    // 9. Workflows
    const defaultWorkflow: WorkflowInstance = {
      id: 'wf-mkt-campaign-01',
      definitionName: 'Autonomous Product Launch Campaign',
      category: 'marketing',
      description: 'End-to-end launch workflow: research, audience synthesis, copywriting, security check, executive approval, and deployment.',
      initiatorEmployeeId: 'emp-kelly',
      currentStepIndex: 2,
      status: 'running',
      startedAt: '2026-09-30T09:00:00Z',
      steps: [
        {
          stepId: 'step-1',
          title: 'Audience & Competitor Intelligence Gathering',
          assigneeRole: 'Director of Corporate Intelligence',
          requiredCapability: 'internet_research',
          departmentId: 'dept-corp-intel',
          timeoutMs: 120_000,
          requiresHumanApproval: false,
          dependencies: [],
          status: 'completed',
          outputResult: { competitorKey: 'Zero competitors with full virtual corporate workforce', targetAudience: 'Enterprise CTOs' },
        },
        {
          stepId: 'step-2',
          title: 'Autonomous Technical Copywriting & Press Release',
          assigneeRole: 'Director of Marketing & Brand',
          requiredCapability: 'copywriting',
          departmentId: 'dept-mkt',
          timeoutMs: 180_000,
          requiresHumanApproval: false,
          dependencies: ['step-1'],
          status: 'completed',
          outputResult: { headline: 'Rufflo Introduces the First Fully Autonomous Virtual Corporation' },
        },
        {
          stepId: 'step-3',
          title: 'Zero-Trust Security & Trademark Policy Validation',
          assigneeRole: 'Chief Information Security Officer (CISO)',
          requiredCapability: 'security_analysis',
          departmentId: 'dept-sec',
          timeoutMs: 90_000,
          requiresHumanApproval: false,
          dependencies: ['step-2'],
          status: 'running',
        },
        {
          stepId: 'step-4',
          title: 'Executive Office Launch Authorization',
          assigneeRole: 'CEO & Fleet Commander',
          requiredCapability: 'executive_decision',
          departmentId: 'dept-exec',
          timeoutMs: 300_000,
          requiresHumanApproval: true,
          dependencies: ['step-3'],
          status: 'pending',
        },
      ],
      auditTrail: [
        { timestamp: '2026-09-30T09:00:00Z', event: 'Workflow initiated by Kelly Kapoor', actor: 'emp-kelly' },
        { timestamp: '2026-09-30T09:01:45Z', event: 'Step 1 completed by Ryan Howard', actor: 'emp-ryan' },
        { timestamp: '2026-09-30T09:04:12Z', event: 'Step 2 completed by Kelly Kapoor', actor: 'emp-kelly' },
        { timestamp: '2026-09-30T09:04:15Z', event: 'Step 3 dispatched to Dwight Schrute', actor: 'system' },
      ],
    };
    this.workflows.set(defaultWorkflow.id, defaultWorkflow);

    // 10. Explicit Decisions
    const defaultDecision: DecisionRecord = {
      id: 'dec-001',
      title: 'Allocation of Q3 Autonomous Compute Budget',
      objective: 'Allocate $1,800,000 for high-density GPU model reasoning and continuous discovery sweeps.',
      alternatives: [
        { id: 'alt-1', title: 'Prioritize Gemini 3.8 Ultra High Throughput', pros: ['Fastest turnarounds', 'Native multi-modal tool use'], cons: ['Higher token consumption'], estimatedCostUSD: 1_200_000, riskRating: 'LOW' },
        { id: 'alt-2', title: 'Self-host Local Quantized Llama Models', pros: ['Zero third-party token cost'], cons: ['High infrastructure management overhead', 'Inferior reasoning'], estimatedCostUSD: 2_100_000, riskRating: 'HIGH' },
      ],
      chosenAlternativeId: 'alt-1',
      evidence: [
        'Benchmarked Gemini 3.8 Flash achieving 99.4% accuracy on synthetic task plans at 1/5th the cost of local cluster provisioning.',
      ],
      assumptions: ['API quotas remain stable at 120 RPM tier.'],
      risks: ['External vendor rate changes (mitigated by multi-provider model router).'],
      constraints: ['Must not exceed Angela Martins monthly treasury allocation ceiling.'],
      decisionMakerId: 'emp-michael',
      decisionMakerTitle: 'CEO & Fleet Commander',
      timestamp: '2026-09-25T14:00:00Z',
      expectedOutcome: '35% acceleration in software construction cycle times with zero budget overruns.',
      actualOutcome: 'Exceeded target: achieved 41% speedup with $340k budget surplus.',
      status: 'executed',
    };
    this.decisions.set(defaultDecision.id, defaultDecision);

    // 11. Failures as First-Class Knowledge
    const defaultFailure: FailureRecord = {
      id: 'fail-001',
      title: 'SyntaxError: TypeScript Enum Stripping in Node 22',
      failureType: 'execution_error',
      employeeId: 'emp-hank',
      employeeName: 'Hank Tate',
      environmentSummary: 'Node v22.14.0 on Linux x86_64 running node server.ts with --experimental-strip-types.',
      rootCause: 'Node 22 native type-stripping strips type annotations but cannot transpile TypeScript enums into runtime JavaScript objects.',
      attemptedSolutions: [
        'Attempted tsx in production (rejected due to memory footprint and start script contract)',
        'Attempted babel transform (unnecessary build complexity)',
      ],
      finalSolution: 'Refactored all enums to immutable const objects using `as const` with companion union types.',
      preventionStrategy: 'Added linting rule and updated technical knowledge base (know-02). All future developers must use const object patterns.',
      severity: 'HIGH',
      timestamp: '2026-09-30T17:24:00Z',
      isResolved: true,
    };
    this.failures.set(defaultFailure.id, defaultFailure);

    // 12. Governance Audit Log
    this.auditLog = [
      {
        id: 'audit-001',
        timestamp: '2026-09-30T17:24:32Z',
        who: 'emp-hank (Hank Tate)',
        what: 'Refactored CapabilityCategory & RoleCategory to const object pattern',
        why: 'Eliminate Node 22 strip-types runtime crash',
        withWhichTool: 'edit_file',
        usingWhichAuthorization: 'engineering:write',
        withWhichInput: { targetFile: 'server/ai/company/workforce/role.registry.ts' },
        whatResulted: { status: 'success', buildPassed: true },
        riskClassification: 'LOW',
        status: 'allowed',
      },
      {
        id: 'audit-002',
        timestamp: '2026-09-30T17:35:10Z',
        who: 'emp-dwight (Dwight Schrute)',
        what: 'Executed zero-trust credential sanitization sweep',
        why: 'Verify that GEMINI_API_KEY and GITHUB_TOKEN are never exposed to client bundles',
        withWhichTool: 'secrets-scanner',
        usingWhichAuthorization: 'security:audit',
        withWhichInput: { scope: 'src/ and dist/' },
        whatResulted: { zeroLeaksDetected: true },
        riskClassification: 'LOW',
        status: 'allowed',
      },
    ];
  }

  public saveToDisk() {
    try {
      const data = {
        company: this.company,
        divisions: Array.from(this.divisions.values()),
        departments: Array.from(this.departments.values()),
        teams: Array.from(this.teams.values()),
        employees: Array.from(this.employees.values()),
        portfolios: Array.from(this.portfolios.values()),
        programs: Array.from(this.programs.values()),
        projects: Array.from(this.projects.values()),
        milestones: Array.from(this.milestones.values()),
        tasks: Array.from(this.tasks.values()),
        knowledge: Array.from(this.knowledge.values()),
        discoveries: Array.from(this.discoveries.values()),
        workflows: Array.from(this.workflows.values()),
        decisions: Array.from(this.decisions.values()),
        failures: Array.from(this.failures.values()),
        auditLog: this.auditLog.slice(-500),
      };
      fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      this.isDirty = false;
    } catch (err) {
      console.error('[CorporationStore] Failed to save to disk:', err);
      throw new Error('Failed to persist the corporation database.', { cause: err });
    }
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(STORE_FILE_PATH)) return;
      const raw = fs.readFileSync(STORE_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data.company) this.company = data.company;
      if (Array.isArray(data.divisions)) data.divisions.forEach((d: Division) => this.divisions.set(d.id, d));
      if (Array.isArray(data.departments)) data.departments.forEach((d: Department) => this.departments.set(d.id, d));
      if (Array.isArray(data.teams)) data.teams.forEach((t: Team) => this.teams.set(t.id, t));
      if (Array.isArray(data.employees)) data.employees.forEach((e: PersistentVirtualEmployee) => this.employees.set(e.id, e));
      if (Array.isArray(data.portfolios)) data.portfolios.forEach((p: Portfolio) => this.portfolios.set(p.id, p));
      if (Array.isArray(data.programs)) data.programs.forEach((p: Program) => this.programs.set(p.id, p));
      if (Array.isArray(data.projects)) data.projects.forEach((p: Project) => this.projects.set(p.id, p));
      if (Array.isArray(data.milestones)) data.milestones.forEach((m: Milestone) => this.milestones.set(m.id, m));
      if (Array.isArray(data.tasks)) data.tasks.forEach((t: CorporateTask) => this.tasks.set(t.id, t));
      if (Array.isArray(data.knowledge)) data.knowledge.forEach((k: LayeredKnowledgeItem) => this.knowledge.set(k.id, k));
      if (Array.isArray(data.discoveries)) data.discoveries.forEach((d: WorldDiscovery) => this.discoveries.set(d.id, d));
      if (Array.isArray(data.workflows)) data.workflows.forEach((w: WorkflowInstance) => this.workflows.set(w.id, w));
      if (Array.isArray(data.decisions)) data.decisions.forEach((d: DecisionRecord) => this.decisions.set(d.id, d));
      if (Array.isArray(data.failures)) data.failures.forEach((f: FailureRecord) => this.failures.set(f.id, f));
      if (Array.isArray(data.auditLog)) this.auditLog = data.auditLog;
    } catch (err) {
      console.warn('[CorporationStore] Could not load from disk, using bootstrapped defaults:', err);
    }
  }

  public recordAudit(entry: Omit<GovernanceAuditEntry, 'id' | 'timestamp'>): GovernanceAuditEntry {
    const fullEntry: GovernanceAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLog.unshift(fullEntry);
    if (this.auditLog.length > 500) this.auditLog.pop();
    this.saveToDisk();
    return fullEntry;
  }
}

export const corporationStore = CorporationStore.getInstance();
