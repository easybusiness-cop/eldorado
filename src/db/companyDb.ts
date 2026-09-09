import fs from 'fs';
import path from 'path';
import {
  HQFloorInfo,
  HQDepartmentDetails,
  HQMeeting,
  HQMemoryEntry,
  CrossDeptWorkflow
} from '../types';

export const INITIAL_FLOORS: HQFloorInfo[] = [
  {
    id: 'rooftop',
    level: 13,
    code: 'ROOF',
    name: 'Rooftop Innovation Observatory',
    logo: '🌌',
    departmentId: 'rooftop_cmd',
    departmentName: 'Innovation Observatory & Holographic Command',
    headId: 'michael',
    headName: 'Michael G. Scott',
    headRole: 'CEO & Fleet Commander',
    status: 'OPERATIONAL',
    activeAgentCount: 12,
    activeProjectsCount: 5,
    pendingApprovalsCount: 1,
    workloadPercent: 72,
    alerts: ['Company Hologram Online', 'Zero-Trust Sky Bridge Active'],
    description: 'Executive observatory, strategic war room, holographic operations map, and company-wide simulation arena.',
    securityClassification: 'TOP_SECRET'
  },
  {
    id: '12',
    level: 12,
    code: '12',
    name: 'Data Center & Compute Infrastructure',
    logo: '🖥️',
    departmentId: 'infrastructure',
    departmentName: 'Data Center & Cloud Infrastructure',
    headId: 'dwight',
    headName: 'Dwight Schrute',
    headRole: 'Chief Infrastructure Officer (CIO)',
    status: 'OPERATIONAL',
    activeAgentCount: 8,
    activeProjectsCount: 4,
    pendingApprovalsCount: 0,
    workloadPercent: 88,
    alerts: ['Server Rack Cluster 100% Operational', 'Zero Node Evictions'],
    description: 'High-density compute clusters, vector databases, network operations center (NOC), storage arrays, and automated backup/recovery daemons.',
    securityClassification: 'TOP_SECRET'
  },
  {
    id: '11',
    level: 11,
    code: '11',
    name: 'Security Operations Center (SOC) & Risk',
    logo: '🛡️',
    departmentId: 'security_soc',
    departmentName: 'Cybersecurity & Governance',
    headId: 'dwight_soc',
    headName: 'Dwight Schrute',
    headRole: 'Chief Information Security Officer (CISO)',
    status: 'OPERATIONAL',
    activeAgentCount: 6,
    activeProjectsCount: 3,
    pendingApprovalsCount: 1,
    workloadPercent: 92,
    alerts: ['Zero-Trust Audit Gate Active', '0 Active Intrusions'],
    description: '24/7 SIEM monitoring, threat intelligence, identity ACL enforcement, audit trail verification, and incident response.',
    securityClassification: 'TOP_SECRET'
  },
  {
    id: '10',
    level: 10,
    code: '10',
    name: 'Human Resources & Agent Academy',
    logo: '📋',
    departmentId: 'hr',
    departmentName: 'Human Resources & Academy',
    headId: 'toby_hr',
    headName: 'Toby Flenderson',
    headRole: 'Chief Human Resources Officer (CHRO)',
    status: 'OPERATIONAL',
    activeAgentCount: 5,
    activeProjectsCount: 3,
    pendingApprovalsCount: 0,
    workloadPercent: 54,
    alerts: ['Agent Academy Level 8 Curriculum Active'],
    description: 'Talent recruitment, CSE Agent Academy certifications, performance evaluations, agent onboarding, and persona alignment.',
    securityClassification: 'CONFIDENTIAL'
  },
  {
    id: '9',
    level: 9,
    code: '9',
    name: 'Finance & P&L Operations',
    logo: '📊',
    departmentId: 'finance',
    departmentName: 'Finance & Treasury',
    headId: 'kevin',
    headName: 'Kevin Malone',
    headRole: 'Chief Financial Officer (CFO)',
    status: 'OPERATIONAL',
    activeAgentCount: 5,
    activeProjectsCount: 2,
    pendingApprovalsCount: 2,
    workloadPercent: 64,
    alerts: ['Runway 18 Months Confirmed', 'Monthly Reconciliation Complete'],
    description: 'Financial accounting, token cost tracking, cash flow forecasting, invoice processing, and risk gating.',
    securityClassification: 'RESTRICTED'
  },
  {
    id: '8',
    level: 8,
    code: '8',
    name: 'Sales & Customer Success',
    logo: '📈',
    departmentId: 'sales',
    departmentName: 'Sales & Revenue Ops',
    headId: 'todd_sales',
    headName: 'Todd Packer',
    headRole: 'Chief Revenue Officer (CRO)',
    status: 'OPERATIONAL',
    activeAgentCount: 7,
    activeProjectsCount: 4,
    pendingApprovalsCount: 1,
    workloadPercent: 78,
    alerts: ['ARR +$520k Pipeline', 'Enterprise SLA 99.9%'],
    description: 'Sales CRM pipeline, enterprise contract onboarding, customer success account management, and support resolution.',
    securityClassification: 'INTERNAL'
  },
  {
    id: '7',
    level: 7,
    code: '7',
    name: 'Branding, Marketing & Media Studio',
    logo: '🚀',
    departmentId: 'marketing',
    departmentName: 'Marketing & Creative Studio',
    headId: 'jim',
    headName: 'Jim Halpert',
    headRole: 'Chief Marketing Officer (CMO)',
    status: 'OPERATIONAL',
    activeAgentCount: 5,
    activeProjectsCount: 3,
    pendingApprovalsCount: 0,
    workloadPercent: 60,
    alerts: ['Q3 Campaign Active', 'Social Media Automation Running'],
    description: 'Brand identity, viral marketing campaigns, content generation, video studio, and customer acquisition funnels.',
    securityClassification: 'PUBLIC'
  },
  {
    id: '6',
    level: 6,
    code: '6',
    name: 'Product & Design Systems',
    logo: '🎨',
    departmentId: 'product',
    departmentName: 'Product & Design',
    headId: 'kelly_product',
    headName: 'Kelly Kapoor',
    headRole: 'Chief Product Officer (CPO)',
    status: 'OPERATIONAL',
    activeAgentCount: 6,
    activeProjectsCount: 5,
    pendingApprovalsCount: 1,
    workloadPercent: 72,
    alerts: ['v1.5 Feature Specs Approved'],
    description: 'Product roadmap, feature UX wireframes, user experience research, design system tokens, and prototype validation.',
    securityClassification: 'INTERNAL'
  },
  {
    id: '5',
    level: 5,
    code: '5',
    name: 'Research & Development (R&D)',
    logo: '🔬',
    departmentId: 'rnd',
    departmentName: 'Research & Development',
    headId: 'oscar_rnd',
    headName: 'Oscar Martinez',
    headRole: 'Head of R&D',
    status: 'OPERATIONAL',
    activeAgentCount: 6,
    activeProjectsCount: 4,
    pendingApprovalsCount: 0,
    workloadPercent: 82,
    alerts: ['Paper Analysis Engine Active', '12 Research Notes Published'],
    description: 'Academic paper analysis, novelty benchmarking, experimental agent architectures, and open-source learning ingestion.',
    securityClassification: 'RESTRICTED'
  },
  {
    id: '4',
    level: 4,
    code: '4',
    name: 'AI & Agent Research Center',
    logo: '🧠',
    departmentId: 'ai_research',
    departmentName: 'AI & Autonomous Systems Research',
    headId: 'ruflo_ai',
    headName: 'Ruflo',
    headRole: 'Chief AI Scientist',
    status: 'OPERATIONAL',
    activeAgentCount: 8,
    activeProjectsCount: 5,
    pendingApprovalsCount: 1,
    workloadPercent: 90,
    alerts: ['Transformer Quantization Benchmark Complete'],
    description: 'Model fine-tuning, reasoning graph evaluation, multi-agent mesh protocols, context compression, and memory labs.',
    securityClassification: 'TOP_SECRET'
  },
  {
    id: '3',
    level: 3,
    code: '3',
    name: 'Engineering Labs & Master Sandbox',
    logo: '🧪',
    departmentId: 'eng_labs',
    departmentName: 'Engineering Practical Labs',
    headId: 'cline_labs',
    headName: 'Cline',
    headRole: 'Principal Lab Master',
    status: 'OPERATIONAL',
    activeAgentCount: 9,
    activeProjectsCount: 6,
    pendingApprovalsCount: 2,
    workloadPercent: 94,
    alerts: ['Master Sandbox Operational', 'Failure School Active'],
    description: 'Coding pods, debugging lab, automated testing lab, performance profiler, security sandbox, and Master Engineer self-development suite.',
    securityClassification: 'RESTRICTED'
  },
  {
    id: '2',
    level: 2,
    code: '2',
    name: 'Software Engineering Department',
    logo: '⚡',
    departmentId: 'engineering',
    departmentName: 'Software Engineering & Architecture',
    headId: 'ruflo',
    headName: 'Ruflo',
    headRole: 'Chief Technology Officer (CTO)',
    status: 'OPERATIONAL',
    activeAgentCount: 11,
    activeProjectsCount: 7,
    pendingApprovalsCount: 1,
    workloadPercent: 86,
    alerts: ['Mastra Agent Router Online', '100% CI Pipeline Success'],
    description: 'Core software architecture, backend microservices, frontend applications, GitHub tool integration, and DevOps automation.',
    securityClassification: 'INTERNAL'
  },
  {
    id: '1',
    level: 1,
    code: 'G',
    name: 'Ground Floor Lobby & Reception',
    logo: '🏢',
    departmentId: 'customer_success',
    departmentName: 'Ground Lobby & Visitor Reception',
    headId: 'erin_support',
    headName: 'Erin Hannon',
    headRole: 'Head of Ground Operations',
    status: 'OPERATIONAL',
    activeAgentCount: 4,
    activeProjectsCount: 2,
    pendingApprovalsCount: 0,
    workloadPercent: 50,
    alerts: ['Visitor Directory Online', 'Lobby Security Active'],
    description: 'Ground floor welcome lobby, visitor registration, main operations display, and elevator access control.',
    securityClassification: 'PUBLIC'
  }
];

export const INITIAL_DEPARTMENTS_MAP: Record<string, HQDepartmentDetails> = {
  rooftop_cmd: {
    id: 'rooftop_cmd',
    floorId: '10',
    floorCode: '10',
    name: 'HQ Command Center',
    headId: 'michael',
    headName: 'Michael G. Scott',
    headRole: 'CEO & Fleet Commander',
    headAvatar: '👔',
    description: 'Global control plane overseeing fleet operations, real-time telemetry streaming, incident management, and executive decisions.',
    managerIds: ['michael', 'dwight', 'ruflo'],
    agentIds: ['michael', 'dwight', 'ruflo', 'toby', 'jim', 'kevin', 'pam'],
    workspaces: ['Fleet Telemetry Hub', 'War Room Station', 'Global Risk Monitor', 'Incident Dispatch'],
    budget: { monthly: 200000, toolCosts: 35000, apiCosts: 45000, infraCosts: 60000, agentOperatingCosts: 30000, totalSpent: 170000 },
    kpis: [
      { id: 'k1', label: 'Fleet Health', value: '99.9%', target: '99.5%', unit: '%', status: 'good', trend: 'stable' },
      { id: 'k2', label: 'Active Tasks', value: 42, target: 50, unit: 'tasks', status: 'good', trend: 'up' },
      { id: 'k3', label: 'Avg Latency', value: '142ms', target: '200ms', unit: 'ms', status: 'good', trend: 'down' }
    ],
    meetingRooms: [
      { id: 'mr-boardroom', name: 'Executive Boardroom', type: 'Executive Boardroom', capacity: 16, isOccupied: true, currentTopic: 'Q3 Multi-Agent Scaling & Revenue Strategy', participants: ['Michael', 'Ruflo', 'Dwight', 'Kevin'] },
      { id: 'mr-warroom', name: 'Incident War Room', type: 'War Room', capacity: 10, isOccupied: false, currentTopic: 'Standby' }
    ],
    memoryNamespace: '/memory/company',
    policyRules: ['pol-git-merge', 'pol-db-write-prod', 'pol-db-alter'],
    securityClassification: 'TOP_SECRET',
    activeProjectsCount: 4,
    activeTasksCount: 18,
    status: 'OPERATIONAL'
  },
  executive: {
    id: 'executive',
    floorId: '10',
    floorCode: '10',
    name: 'Executive Operations',
    headId: 'michael',
    headName: 'Michael G. Scott',
    headRole: 'CEO & Chief of Staff',
    headAvatar: '👔',
    description: 'Overall company strategy, task decomposition, priorities and executive escalations.',
    managerIds: ['michael'],
    agentIds: ['michael', 'exec_chief_of_staff', 'exec_strategy', 'exec_bi'],
    workspaces: ['CEO Suite', 'Strategy War Room', 'Business Intelligence Deck'],
    budget: { monthly: 150000, toolCosts: 20000, apiCosts: 30000, infraCosts: 25000, agentOperatingCosts: 45000, totalSpent: 120000 },
    kpis: [
      { id: 'k-ex-1', label: 'MRR Growth', value: '$45,000', target: '$50,000', unit: 'USD', status: 'good', trend: 'up' },
      { id: 'k-ex-2', label: 'Runway', value: '18 Months', target: '12 Months', unit: 'Months', status: 'good', trend: 'stable' }
    ],
    meetingRooms: [
      { id: 'mr-exec-1', name: 'Strategy Conference Room', type: 'Conference Room', capacity: 12, isOccupied: true, currentTopic: 'Enterprise Fleet Expansion', participants: ['Michael', 'Chief of Staff'] }
    ],
    memoryNamespace: '/memory/department/executive',
    policyRules: ['pol-git-merge', 'pol-invoice-finance'],
    securityClassification: 'TOP_SECRET',
    activeProjectsCount: 3,
    activeTasksCount: 12,
    status: 'OPERATIONAL'
  },
  finance: {
    id: 'finance',
    floorId: '9',
    floorCode: '9',
    name: 'Finance & Accounting',
    headId: 'kevin',
    headName: 'Kevin Malone',
    headRole: 'Chief Financial Officer (CFO)',
    headAvatar: '📊',
    description: 'Financial ledger, cash allocation, MRR tracking, budget boundaries, and cost controls.',
    managerIds: ['kevin'],
    agentIds: ['kevin', 'fin_ap', 'fin_ar', 'fin_analyst', 'fin_budget'],
    workspaces: ['CFO Office', 'Accounts Ledger Station', 'Budget Audit Desk'],
    budget: { monthly: 60000, toolCosts: 8000, apiCosts: 12000, infraCosts: 10000, agentOperatingCosts: 15000, totalSpent: 45000 },
    kpis: [
      { id: 'k-fn-1', label: 'Budget Variance', value: '-2.4%', target: '0%', unit: '%', status: 'good', trend: 'down' },
      { id: 'k-fn-2', label: 'LLM Cost Efficiency', value: '$0.0012/req', target: '$0.0020/req', unit: 'USD', status: 'good', trend: 'down' }
    ],
    meetingRooms: [
      { id: 'mr-fin-1', name: 'Audit Room 9A', type: 'Review Room', capacity: 8, isOccupied: false, currentTopic: 'Monthly Reconciliation' }
    ],
    memoryNamespace: '/memory/department/finance',
    policyRules: ['pol-invoice-finance'],
    securityClassification: 'RESTRICTED',
    activeProjectsCount: 2,
    activeTasksCount: 8,
    status: 'OPERATIONAL'
  },
  legal: {
    id: 'legal',
    floorId: '8',
    floorCode: '8',
    name: 'Legal & Compliance',
    headId: 'oscar_legal',
    headName: 'Oscar Martinez',
    headRole: 'General Counsel',
    headAvatar: '⚖️',
    description: 'Contract reviews, regulatory compliance, risk assessment, IP protection, and policy enforcement.',
    managerIds: ['oscar_legal'],
    agentIds: ['oscar_legal', 'leg_contracts', 'leg_compliance', 'leg_risk'],
    workspaces: ['General Counsel Office', 'Contract Vault', 'Compliance Desk'],
    budget: { monthly: 85000, toolCosts: 12000, apiCosts: 15000, infraCosts: 18000, agentOperatingCosts: 20000, totalSpent: 65000 },
    kpis: [
      { id: 'k-lg-1', label: 'Contract Turnaround', value: '4.2 hrs', target: '8 hrs', unit: 'hours', status: 'good', trend: 'down' },
      { id: 'k-lg-2', label: 'Compliance Score', value: '100%', target: '100%', unit: '%', status: 'good', trend: 'stable' }
    ],
    meetingRooms: [
      { id: 'mr-leg-1', name: 'Legal Review Suite', type: 'Review Room', capacity: 6, isOccupied: true, currentTopic: 'Enterprise Service Level Agreement Terms', participants: ['Oscar', 'Contract Agent'] }
    ],
    memoryNamespace: '/memory/department/legal',
    policyRules: ['pol-delete-bucket'],
    securityClassification: 'RESTRICTED',
    activeProjectsCount: 2,
    activeTasksCount: 6,
    status: 'ATTENTION'
  },
  hr: {
    id: 'hr',
    floorId: '7',
    floorCode: '7',
    name: 'Human Resources & People',
    headId: 'toby_hr',
    headName: 'Toby Flenderson',
    headRole: 'Chief Human Resources Officer (CHRO)',
    headAvatar: '📋',
    description: 'Talent acquisition, onboarding, agent training state evaluations, performance reviews, and confidential personnel data.',
    managerIds: ['toby_hr'],
    agentIds: ['toby_hr', 'hr_recruiter', 'hr_onboarding', 'hr_training', 'hr_people_ops'],
    workspaces: ['CHRO Office', 'Recruiting Hub', 'Onboarding & Training Center'],
    budget: { monthly: 75000, toolCosts: 10000, apiCosts: 14000, infraCosts: 12000, agentOperatingCosts: 22000, totalSpent: 58000 },
    kpis: [
      { id: 'k-hr-1', label: 'Agent Retention', value: '100%', target: '98%', unit: '%', status: 'good', trend: 'stable' },
      { id: 'k-hr-2', label: 'Onboarding Velocity', value: '1.2 days', target: '2.0 days', unit: 'days', status: 'good', trend: 'down' }
    ],
    meetingRooms: [
      { id: 'mr-hr-1', name: 'People Ops Room 7B', type: 'Department Room', capacity: 6, isOccupied: false, currentTopic: 'Standby' }
    ],
    memoryNamespace: '/memory/department/hr',
    policyRules: [],
    securityClassification: 'CONFIDENTIAL',
    activeProjectsCount: 3,
    activeTasksCount: 9,
    status: 'OPERATIONAL'
  },
  sales: {
    id: 'sales',
    floorId: '6',
    floorCode: '6',
    name: 'Sales & Revenue Ops',
    headId: 'todd_sales',
    headName: 'Todd Packer',
    headRole: 'Chief Revenue Officer (CRO)',
    headAvatar: '📈',
    description: 'Lead qualification, enterprise deal proposals, CRM management, pipeline forecasting, and customer conversions.',
    managerIds: ['todd_sales'],
    agentIds: ['todd_sales', 'sales_sdr', 'sales_ae', 'sales_proposal', 'sales_analyst', 'sales_researcher'],
    workspaces: ['CRO Suite', 'Sales Floor Pit', 'Deal Proposal Station'],
    budget: { monthly: 110000, toolCosts: 25000, apiCosts: 22000, infraCosts: 18000, agentOperatingCosts: 30000, totalSpent: 95000 },
    kpis: [
      { id: 'k-sl-1', label: 'Pipeline Value', value: '$850,000', target: '$750,000', unit: 'USD', status: 'good', trend: 'up' },
      { id: 'k-sl-2', label: 'Win Rate', value: '34.2%', target: '30.0%', unit: '%', status: 'good', trend: 'up' }
    ],
    meetingRooms: [
      { id: 'mr-sl-1', name: 'Deal Closing Room', type: 'Project Room', capacity: 8, isOccupied: true, currentTopic: 'Acme Corp $120k Contract Terms', participants: ['Todd', 'SDR Agent'] }
    ],
    memoryNamespace: '/memory/department/sales',
    policyRules: ['pol-invoice-finance'],
    securityClassification: 'INTERNAL',
    activeProjectsCount: 4,
    activeTasksCount: 14,
    status: 'OPERATIONAL'
  },
  marketing: {
    id: 'marketing',
    floorId: '5',
    floorCode: '5',
    name: 'Branding & Marketing',
    headId: 'jim',
    headName: 'Jim Halpert',
    headRole: 'Chief Marketing Officer (CMO)',
    headAvatar: '🚀',
    description: 'Customer acquisition, brand value, campaign management, organic growth, and SEO optimization.',
    managerIds: ['jim', 'ryan'],
    agentIds: ['jim', 'ryan', 'mkt_content', 'mkt_seo', 'mkt_social', 'mkt_campaign'],
    workspaces: ['CMO Suite', 'Creative Design Studio', 'Analytics & Content Desk'],
    budget: { monthly: 95000, toolCosts: 18000, apiCosts: 20000, infraCosts: 15000, agentOperatingCosts: 25000, totalSpent: 78000 },
    kpis: [
      { id: 'k-mk-1', label: 'Monthly Traffic', value: '142,000', target: '120,000', unit: 'visits', status: 'good', trend: 'up' },
      { id: 'k-mk-2', label: 'Lead Conversion', value: '4.8%', target: '4.0%', unit: '%', status: 'good', trend: 'up' }
    ],
    meetingRooms: [
      { id: 'mr-mk-1', name: 'Creative Studio 5A', type: 'Project Room', capacity: 10, isOccupied: false, currentTopic: 'Standby' }
    ],
    memoryNamespace: '/memory/department/marketing',
    policyRules: [],
    securityClassification: 'PUBLIC',
    activeProjectsCount: 3,
    activeTasksCount: 10,
    status: 'OPERATIONAL'
  },
  product: {
    id: 'product',
    floorId: '4',
    floorCode: '4',
    name: 'Product & Design',
    headId: 'kelly_product',
    headName: 'Kelly Kapoor',
    headRole: 'Chief Product Officer (CPO)',
    headAvatar: '🎨',
    description: 'Product roadmap, feature requirement specifications, user research, UI/UX design systems, and prototype validation.',
    managerIds: ['kelly_product'],
    agentIds: ['kelly_product', 'prd_pm', 'prd_analyst', 'prd_ux_researcher', 'prd_ui_designer', 'prd_strategist'],
    workspaces: ['CPO Office', 'UI/UX Design Lab', 'Roadmap Planning Station'],
    budget: { monthly: 120000, toolCosts: 22000, apiCosts: 25000, infraCosts: 20000, agentOperatingCosts: 35000, totalSpent: 102000 },
    kpis: [
      { id: 'k-pr-1', label: 'Feature Velocity', value: '14 features/mo', target: '12 features/mo', unit: 'features', status: 'good', trend: 'up' },
      { id: 'k-pr-2', label: 'User Satisfaction', value: '4.9 / 5.0', target: '4.5 / 5.0', unit: 'rating', status: 'good', trend: 'stable' }
    ],
    meetingRooms: [
      { id: 'mr-pr-1', name: 'Design Review Room', type: 'Review Room', capacity: 8, isOccupied: true, currentTopic: 'Command Center Interactive UI Mockups', participants: ['Kelly', 'UI Designer'] }
    ],
    memoryNamespace: '/memory/department/product',
    policyRules: [],
    securityClassification: 'INTERNAL',
    activeProjectsCount: 5,
    activeTasksCount: 16,
    status: 'OPERATIONAL'
  },
  engineering: {
    id: 'engineering',
    floorId: '3',
    floorCode: '3',
    name: 'Software Engineering',
    headId: 'ruflo',
    headName: 'Ruflo',
    headRole: 'Chief Technology Officer (CTO)',
    headAvatar: '⚡',
    description: 'Development, architecture, code reviews, automated QA, and systems release pipeline.',
    managerIds: ['ruflo', 'sub-eng-arch'],
    agentIds: ['ruflo', 'cline', 'sub-eng-arch', 'sub-eng-backend', 'eng_frontend', 'eng_mobile', 'eng_devops', 'eng_qa', 'eng_security', 'eng_data'],
    workspaces: ['CTO Office', 'Backend Cluster', 'Frontend UI Lab', 'DevOps & Infrastructure Deck', 'QA Automation Hub'],
    budget: { monthly: 280000, toolCosts: 45000, apiCosts: 85000, infraCosts: 90000, agentOperatingCosts: 50000, totalSpent: 270000 },
    kpis: [
      { id: 'k-eng-1', label: 'Build Pass Rate', value: '100%', target: '99%', unit: '%', status: 'good', trend: 'stable' },
      { id: 'k-eng-2', label: 'PR Cycle Time', value: '18 mins', target: '30 mins', unit: 'mins', status: 'good', trend: 'down' },
      { id: 'k-eng-3', label: 'Deployments', value: '24 / week', target: '20 / week', unit: 'deploys', status: 'good', trend: 'up' }
    ],
    meetingRooms: [
      { id: 'mr-eng-1', name: 'Architecture Review Room 3A', type: 'Department Room', capacity: 10, isOccupied: true, currentTopic: 'Stateful Multi-Floor Elevator Router Architecture', participants: ['Ruflo', 'Cline', 'Dwight-Junior'] },
      { id: 'mr-eng-2', name: 'DevOps War Room 3B', type: 'Project Room', capacity: 6, isOccupied: false, currentTopic: 'Standby' }
    ],
    memoryNamespace: '/memory/department/engineering',
    policyRules: ['pol-git-merge', 'pol-db-write-prod', 'pol-db-alter'],
    securityClassification: 'INTERNAL',
    activeProjectsCount: 6,
    activeTasksCount: 24,
    status: 'OPERATIONAL'
  },
  operations: {
    id: 'operations',
    floorId: '3',
    floorCode: '3',
    name: 'Operations & Logistics',
    headId: 'pam',
    headName: 'Pam Beesly',
    headRole: 'Chief Operating Officer (COO)',
    headAvatar: '📋',
    description: 'HR workflows, office systems, onboarding checkpoints, and standard operating procedures (SOPs).',
    managerIds: ['pam'],
    agentIds: ['pam', 'ops_manager', 'ops_procurement', 'ops_vendor', 'ops_workflow'],
    workspaces: ['COO Office', 'SOP Operations Station', 'Procurement & Vendor Desk'],
    budget: { monthly: 75000, toolCosts: 12000, apiCosts: 15000, infraCosts: 18000, agentOperatingCosts: 20000, totalSpent: 65000 },
    kpis: [
      { id: 'k-op-1', label: 'SOP Compliance', value: '99.2%', target: '98%', unit: '%', status: 'good', trend: 'stable' },
      { id: 'k-op-2', label: 'Vendor Turnaround', value: '1.5 days', target: '3.0 days', unit: 'days', status: 'good', trend: 'down' }
    ],
    meetingRooms: [
      { id: 'mr-op-1', name: 'Ops Conference Room 2A', type: 'Department Room', capacity: 8, isOccupied: false, currentTopic: 'Standby' }
    ],
    memoryNamespace: '/memory/department/operations',
    policyRules: [],
    securityClassification: 'INTERNAL',
    activeProjectsCount: 2,
    activeTasksCount: 7,
    status: 'OPERATIONAL'
  },
  customer_success: {
    id: 'customer_success',
    floorId: '1',
    floorCode: '1',
    name: 'Customer Success & Support',
    headId: 'erin_support',
    headName: 'Erin Hannon',
    headRole: 'Chief Customer Officer (CCO)',
    headAvatar: '🎧',
    description: 'Customer support tickets, SLA tracking, feedback research, customer health monitoring, and knowledge base.',
    managerIds: ['erin_support'],
    agentIds: ['erin_support', 'cs_support_mgr', 'cs_agent_1', 'cs_agent_2', 'cs_feedback', 'cs_kb'],
    workspaces: ['CCO Suite', 'Support Dispatch Pit', 'Knowledge Base Studio'],
    budget: { monthly: 90000, toolCosts: 15000, apiCosts: 25000, infraCosts: 20000, agentOperatingCosts: 22000, totalSpent: 82000 },
    kpis: [
      { id: 'k-cs-1', label: 'Ticket Resolution Time', value: '14 mins', target: '30 mins', unit: 'mins', status: 'good', trend: 'down' },
      { id: 'k-cs-2', label: 'CSAT Score', value: '98.4%', target: '95.0%', unit: '%', status: 'good', trend: 'up' },
      { id: 'k-cs-3', label: 'Open Escalations', value: 0, target: 0, unit: 'count', status: 'good', trend: 'stable' }
    ],
    meetingRooms: [
      { id: 'mr-cs-1', name: 'Customer Triage Room', type: 'Project Room', capacity: 6, isOccupied: false, currentTopic: 'Standby' }
    ],
    memoryNamespace: '/memory/department/customer_success',
    policyRules: [],
    securityClassification: 'PUBLIC',
    activeProjectsCount: 3,
    activeTasksCount: 11,
    status: 'OPERATIONAL'
  },
  reception: {
    id: 'reception',
    floorId: '1',
    floorCode: '1',
    name: 'Lobby & Reception',
    headId: 'pam_reception',
    headName: 'Pam Beesly',
    headRole: 'Lobby Operations Manager',
    headAvatar: '🏢',
    description: 'HQ reception, visitor check-in, directory guidance, company inquiry routing, and lobby security.',
    managerIds: ['pam_reception'],
    agentIds: ['pam_reception', 'rec_greeter', 'rec_directory'],
    workspaces: ['Reception Welcome Desk', 'Visitor Kiosk Station', 'Lobby Lounge'],
    budget: { monthly: 30000, toolCosts: 4000, apiCosts: 6000, infraCosts: 8000, agentOperatingCosts: 10000, totalSpent: 28000 },
    kpis: [
      { id: 'k-rc-1', label: 'Visitors Checked In', value: '142 / day', target: '100 / day', unit: 'visitors', status: 'good', trend: 'up' },
      { id: 'k-rc-2', label: 'Directory Lookup Time', value: '< 1s', target: '2s', unit: 's', status: 'good', trend: 'stable' }
    ],
    meetingRooms: [
      { id: 'mr-rc-1', name: 'Lobby Meeting Alcove', type: 'Department Room', capacity: 4, isOccupied: false, currentTopic: 'Standby' }
    ],
    memoryNamespace: '/memory/department/reception',
    policyRules: [],
    securityClassification: 'PUBLIC',
    activeProjectsCount: 1,
    activeTasksCount: 3,
    status: 'OPERATIONAL'
  },
  infrastructure: {
    id: 'infrastructure',
    floorId: '2',
    floorCode: '2',
    name: 'Cybersecurity & Infrastructure',
    headId: 'dwight',
    headName: 'Dwight Schrute',
    headRole: 'Chief Information Security Officer (CISO)',
    headAvatar: '🛡️',
    description: 'Perimeter audits, threat assessment, access controls, compliance, and patch verification.',
    managerIds: ['dwight', 'stanley', 'toby'],
    agentIds: ['dwight', 'toby', 'stanley', 'sub-sec-vulnerability', 'sub-res-web', 'sub-rel-monitoring', 'inf_sre_lead', 'inf_it_agent'],
    workspaces: ['CISO Vault', 'SOC Cyber Defense Center', 'Server Infrastructure Vault', 'SRE Incident Command'],
    budget: { monthly: 300000, toolCosts: 50000, apiCosts: 80000, infraCosts: 120000, agentOperatingCosts: 45000, totalSpent: 295000 },
    kpis: [
      { id: 'k-inf-1', label: 'Security Score', value: '100 / 100', target: '100 / 100', unit: 'score', status: 'good', trend: 'stable' },
      { id: 'k-inf-2', label: 'SSRF Attempts Blocked', value: '1,420', target: '0 breached', unit: 'threats', status: 'good', trend: 'up' },
      { id: 'k-inf-3', label: 'Server Memory Footprint', value: '28.4 MB', target: '64 MB', unit: 'MB', status: 'good', trend: 'stable' }
    ],
    meetingRooms: [
      { id: 'mr-inf-1', name: 'Cyber Incident Command Center', type: 'War Room', capacity: 12, isOccupied: true, currentTopic: 'Zero-Trust Audit & Penetration Verification', participants: ['Dwight', 'Toby', 'Vulnerability-Analyst'] }
    ],
    memoryNamespace: '/memory/department/infrastructure',
    policyRules: ['pol-git-merge', 'pol-db-write-prod', 'pol-db-alter', 'pol-delete-bucket'],
    securityClassification: 'TOP_SECRET',
    activeProjectsCount: 4,
    activeTasksCount: 22,
    status: 'OPERATIONAL'
  }
};

export const INITIAL_MEETINGS: HQMeeting[] = [
  {
    id: 'mtg-01',
    departmentId: 'engineering',
    departmentName: 'Software Engineering',
    roomName: 'Architecture Review Room 3A',
    title: 'Router-Agnostic Multi-Floor Elevator Architecture',
    agenda: 'Design persistent elevator navigation state, URL synchronizer, and backend security boundaries.',
    participants: ['Ruflo', 'Cline', 'Dwight-Junior'],
    owner: 'Ruflo',
    context: 'Command 03 Implementation',
    decisions: [
      'Elevator state must sync with URL path /hq/floor/:floorId and /hq/department/:departmentId',
      'Backend will enforce department memory ACL checks on all API calls',
      'All floors render functional interactive department workspaces'
    ],
    actions: [
      'Mount /api/hq and /api/floors routes on Express server',
      'Build persistent Elevator component with keyboard shortcuts and breadcrumbs',
      'Seed 13 full departments into memory and JSON persistence'
    ],
    status: 'in_progress',
    timestamp: new Date().toISOString()
  },
  {
    id: 'mtg-02',
    departmentId: 'rooftop_cmd',
    departmentName: 'HQ Command Center',
    title: 'Executive Fleet Alignment Standup',
    roomName: 'Executive Boardroom',
    agenda: 'Review monthly budget allocations, risk gating on tool execution, and active agent health.',
    participants: ['Michael', 'Ruflo', 'Dwight', 'Kevin'],
    owner: 'Michael G. Scott',
    context: 'Fleet Operational Sync',
    decisions: [
      'Maintain 100% Zero-Trust tool gateway enforcement across all 13 floors',
      'Approve cross-department workflow pipeline for Customer Success -> Product -> Engineering -> QA'
    ],
    actions: [
      'Verify risk calculator thresholds for Stripe and GitHub actions',
      'Run security test suite on every code release'
    ],
    status: 'completed',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export const INITIAL_CROSS_WORKFLOWS: CrossDeptWorkflow[] = [
  {
    id: 'wf-cd-01',
    title: 'Customer Escalation -> Bug Fix -> Release Pipeline',
    type: 'customer_escalation',
    initiatorDepartment: 'customer_success',
    initiatorAgent: 'Erin Hannon',
    status: 'active',
    stages: [
      { id: 'stg-1', departmentId: 'customer_success', departmentName: 'Customer Success', assigneeId: 'erin_support', assigneeName: 'Erin Hannon', action: 'Log & triage priority issue', status: 'completed', result: 'Ticket CS-804 triaged' },
      { id: 'stg-2', departmentId: 'product', departmentName: 'Product & Design', assigneeId: 'kelly_product', assigneeName: 'Kelly Kapoor', action: 'Draft specification & requirement', status: 'completed', result: 'PRD-804 generated' },
      { id: 'stg-3', departmentId: 'engineering', departmentName: 'Software Engineering', assigneeId: 'ruflo', assigneeName: 'Ruflo (CTO)', action: 'Execute hot-fix & unit test', status: 'in_progress' },
      { id: 'stg-4', departmentId: 'infrastructure', departmentName: 'Infrastructure & Security', assigneeId: 'dwight', assigneeName: 'Dwight Schrute', action: 'Zero-trust security audit & deploy', status: 'pending' },
      { id: 'stg-5', departmentId: 'customer_success', departmentName: 'Customer Success', assigneeId: 'erin_support', assigneeName: 'Erin Hannon', action: 'Notify customer of resolution', status: 'pending' }
    ],
    riskLevel: 'medium',
    requiresApproval: true,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'wf-cd-02',
    title: 'Enterprise $120k ARR Contract Approval & Licensing',
    type: 'enterprise_deal',
    initiatorDepartment: 'sales',
    initiatorAgent: 'Todd Packer',
    status: 'active',
    stages: [
      { id: 'stg-201', departmentId: 'sales', departmentName: 'Sales & Revenue Ops', assigneeId: 'todd_sales', assigneeName: 'Todd Packer', action: 'Qualify enterprise lead', status: 'completed', result: 'Acme Corp deal created' },
      { id: 'stg-202', departmentId: 'legal', departmentName: 'Legal & Compliance', assigneeId: 'oscar_legal', assigneeName: 'Oscar Martinez', action: 'Review contract terms', status: 'in_progress' },
      { id: 'stg-203', departmentId: 'finance', departmentName: 'Finance & P&L', assigneeId: 'kevin', assigneeName: 'Kevin Malone', action: 'Verify pricing & payment terms', status: 'pending' },
      { id: 'stg-204', departmentId: 'executive', departmentName: 'Executive Operations', assigneeId: 'michael', assigneeName: 'Michael G. Scott', action: 'Executive sign-off', status: 'pending' }
    ],
    riskLevel: 'high',
    requiresApproval: true,
    approvalStatus: 'pending',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_MEMORIES: HQMemoryEntry[] = [
  {
    id: 'mem-01',
    namespace: '/memory/company',
    departmentId: 'rooftop_cmd',
    key: 'company_vision_2026',
    content: 'Munderdiffl.in is transitioning from simple agent dashboards into a full multi-floor autonomous corporate building.',
    classifiedAs: 'PUBLIC',
    author: 'Michael G. Scott',
    timestamp: new Date().toISOString()
  },
  {
    id: 'mem-02',
    namespace: '/memory/department/engineering',
    departmentId: 'engineering',
    key: 'architecture_guidelines',
    content: 'All API routes must use lazy initialization, validate Content-Type, and enforce policy boundaries.',
    classifiedAs: 'INTERNAL',
    author: 'Ruflo',
    timestamp: new Date().toISOString()
  },
  {
    id: 'mem-03',
    namespace: '/memory/department/hr',
    departmentId: 'hr',
    key: 'confidential_performance_reviews',
    content: 'Confidential agent training scores and salary/token allocations for Q3.',
    classifiedAs: 'CONFIDENTIAL',
    author: 'Toby Flenderson',
    timestamp: new Date().toISOString()
  },
  {
    id: 'mem-04',
    namespace: '/memory/department/finance',
    departmentId: 'finance',
    key: 'restricted_ledger_summary',
    content: 'Executive expense thresholds and restricted bank account token reserves.',
    classifiedAs: 'RESTRICTED',
    author: 'Kevin Malone',
    timestamp: new Date().toISOString()
  }
];

export interface OrganizationInfo {
  id: string;
  name: string;
  founder: string;
  hq: string;
  mrr: number;
  runwayMonths: number;
}

export interface BuildingInfo {
  id: string;
  name: string;
  address: string;
  totalFloors: number;
  operationalStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

export interface AgentContract {
  id: string;
  name: string;
  role: string;
  department: string;
  reportsTo: string;
  jobDescription: string;
  skills: string[];
  tools: string[];
  permissions: {
    filesystem: 'none' | 'scoped' | 'project' | 'unrestricted';
    network: 'none' | 'allowlisted' | 'unrestricted';
    production: boolean;
    secrets: 'none' | 'scoped' | 'full';
  };
  authorityLevel: number; // 0 = read only, 1 = drafts, 2 = project modifications, 3 = development execution, 4 = merge/release, 5 = staging, 6 = production, 7 = company administration
  status: 'active' | 'suspended' | 'vacation' | 'training';
  memorySummary: string;
  
  trainingRecord?: any;
  trainingState: 'UNTRAINED' | 'TRAINING' | 'EVALUATION' | 'SUPERVISED' | 'PRODUCTION';
  kpis: {
    tasksCompleted: number;
    accuracyScore: number;
    uptimeBonusPercent: number;
    tokensProcessed: number;
    totalCost: number;
  };
}

export interface ProjectPortfolio {
  id: string;
  name: string;
  description: string;
  repository: string;
  workspace: string;
  owner: string;
  departments: string[];
  agents: string[];
  status: 'planned' | 'active' | 'on-hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget: number;
  spent: number;
  milestones: { id: string; name: string; status: 'pending' | 'completed'; dueDate: string }[];
  secrets: string[];
  environment: 'development' | 'staging' | 'production';
  deployments: { id: string; env: string; status: string; url?: string; timestamp: string }[];
}

export interface Mission {
  id: string;
  projectId: string;
  title: string;
  objective: string;
  coordinatedBy: string; // manager
  status: 'planned' | 'active' | 'review' | 'completed' | 'failed';
  stages: { name: string; status: 'pending' | 'running' | 'completed'; assignee: string }[];
  createdAt: number;
}

export interface DBTask {
  id: string;
  projectId?: string;
  missionId?: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'blocked' | 'waiting_approval';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  output?: string;
  codeSnippet?: string;
  evidence?: { status: string; source: string; timestamp: string; verificationId?: string }[];
  subtasks: { id: string; title: string; completed: boolean; assignedTo?: string }[];
  createdAt: number;
  completedAt?: number;
}

export interface AuditEvent {
  id: string;
  agentId: string;
  projectId?: string;
  taskId?: string;
  tool: string;
  action: string;
  inputHash: string;
  result: string;
  timestamp: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  approvalRequired: boolean;
  approvedBy?: string;
  executionId: string;
}

export interface CompanyAccount {
  provider: string;
  account: string;
  scopes: string[];
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'ERROR' | 'EXPIRED';
  owner: string;
  lastUsed?: string;
}

export interface AgentMemory {
  id: string;
  agentId: string;
  type: 'working' | 'episodic' | 'semantic';
  content: string;
  projectId?: string;
  importance: number; // 1-10
  confidence: number; // 0-100
  createdAt: number;
}

/**
 * Single Canonical Organizational Database Schema
 * Hierarchy: Organization -> Building -> Floor -> Department -> Employee/Agent -> Task -> Project
 */
export interface CompanyOSSchema {
  organization: OrganizationInfo;
  company: OrganizationInfo; // Compatibility alias
  building: BuildingInfo;
  floors: HQFloorInfo[];
  departments: HQDepartmentDetails[];
  agents: AgentContract[];
  projects: ProjectPortfolio[];
  missions: Mission[];
  tasks: DBTask[];
  audits: AuditEvent[];
  accounts: CompanyAccount[];
  meetings: HQMeeting[];
  workflows: CrossDeptWorkflow[];
  memories: HQMemoryEntry[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'company_db.json');

const INITIAL_ORGANIZATION: OrganizationInfo = {
  id: 'org-dunder-mifflin',
  name: 'Dunder Mifflin Paper & AI Corp.',
  founder: 'Michael G. Scott',
  hq: 'Scranton, Pennsylvania',
  mrr: 45000,
  runwayMonths: 18,
};

const INITIAL_BUILDING: BuildingInfo = {
  id: 'bldg-hq-scranton',
  name: 'AI Company Headquarters',
  address: '1725 Slough Avenue, Scranton, PA',
  totalFloors: INITIAL_FLOORS.length,
  operationalStatus: 'HEALTHY',
};

const INITIAL_EMPLOYEES: AgentContract[] = [
  // HEAD EMPLOYEES
  {
    id: 'michael',
    name: 'Michael G. Scott',
    role: 'CEO & Chief of Staff',
    department: 'executive',
    reportsTo: 'Human Owner',
    jobDescription: 'Guides company hierarchy, schedules hourly standups, coordinates multi-department projects, manages escalations, and leads executive communications.',
    skills: ['Company planning', 'Delegation', 'Prioritization', 'Crisis Management', 'Standups'],
    tools: ['intercom', 'terminal', 'project-editor', 'email'],
    permissions: { filesystem: 'unrestricted', network: 'unrestricted', production: true, secrets: 'full' },
    authorityLevel: 7,
    status: 'active',
    memorySummary: 'Currently overseeing fleet transition to a real fully persistent Company Operating System.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 48, accuracyScore: 98, uptimeBonusPercent: 15, tokensProcessed: 245000, totalCost: 12.45 }
  },
  {
    id: 'ruflo',
    name: 'Ruflo',
    role: 'Chief Technology Officer (CTO)',
    department: 'engineering',
    reportsTo: 'michael',
    jobDescription: 'Spearheads technology roadmap, designs enterprise software architectures, manages developers, and executes high-performance releases.',
    skills: ['System Architecture', 'Node.js', 'TypeScript', 'Drizzle ORM', 'Database scaling'],
    tools: ['filesystem', 'git', 'github', 'terminal', 'npm', 'tests', 'linters'],
    permissions: { filesystem: 'project', network: 'unrestricted', production: true, secrets: 'full' },
    authorityLevel: 6,
    status: 'active',
    memorySummary: 'Hot-patch runtime integrity validated. Ready for autonomous subordinate developer deployments.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 85, accuracyScore: 99.5, uptimeBonusPercent: 15, tokensProcessed: 540000, totalCost: 24.80 }
  },
  {
    id: 'dwight',
    name: 'Dwight Schrute',
    role: 'Chief Security Officer (CSO)',
    department: 'infrastructure',
    reportsTo: 'michael',
    jobDescription: 'Maintains zero-trust cyber perimeter, audits tool permissions, blocks SSRF attack vectors, and executes forensic incident scans.',
    skills: ['Defensive Security', 'SSRF Guarding', 'Access Control Lists', 'Vulnerability Scanning', 'V8 Isolation'],
    tools: ['security-scanner', 'dependency-auditor', 'firewall-manager', 'terminal'],
    permissions: { filesystem: 'project', network: 'allowlisted', production: true, secrets: 'scoped' },
    authorityLevel: 5,
    status: 'active',
    memorySummary: 'Verified sandbox containment on Node VM execution. Localhost/private IP ranges strictly locked.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 110, accuracyScore: 100, uptimeBonusPercent: 15, tokensProcessed: 320000, totalCost: 15.60 }
  },
  {
    id: 'jim',
    name: 'Jim Halpert',
    role: 'Chief Marketing Officer (CMO)',
    department: 'marketing',
    reportsTo: 'michael',
    jobDescription: 'Drafts marketing campaigns, schedules press releases, manages landing page funnels, and evaluates content analytics.',
    skills: ['Marketing Strategy', 'SEO', 'Creative copywriting', 'Lead conversion', 'Brand outreach'],
    tools: ['browser', 'content-composer', 'email', 'analytics-board'],
    permissions: { filesystem: 'scoped', network: 'allowlisted', production: false, secrets: 'scoped' },
    authorityLevel: 4,
    status: 'active',
    memorySummary: 'Optimized outreach pipelines for Project Alpha. User retention up 18.4%.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 62, accuracyScore: 96, uptimeBonusPercent: 10, tokensProcessed: 180000, totalCost: 8.50 }
  },
  {
    id: 'pam',
    name: 'Pam Beesly',
    role: 'COO & People Operations Lead',
    department: 'operations',
    reportsTo: 'michael',
    jobDescription: 'Maintains office SOPs, administers employee checklists, monitors cross-department work streams, and handles onboarding metrics.',
    skills: ['Process Operations', 'SOP Drafting', 'Documentation Specialist', 'Resource Planning'],
    tools: ['sop-editor', 'employee-roster', 'email', 'google-docs'],
    permissions: { filesystem: 'scoped', network: 'allowlisted', production: false, secrets: 'scoped' },
    authorityLevel: 4,
    status: 'active',
    memorySummary: 'Completed updating employee handbooks and machine-readable contract compliance schemas.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 74, accuracyScore: 98.2, uptimeBonusPercent: 12, tokensProcessed: 150000, totalCost: 6.20 }
  },
  {
    id: 'kevin',
    name: 'Kevin Malone',
    role: 'Chief Financial Officer (CFO)',
    department: 'finance',
    reportsTo: 'michael',
    jobDescription: 'Calculates MRR metrics, balances department budgets, ensures absolute cost boundaries for LLM usage, and reports runway.',
    skills: ['Runway analysis', 'Budget gating', 'Cost tracking', 'Keven-arithmetic'],
    tools: ['ledger', 'budget-tracker', 'excel-macro', 'email'],
    permissions: { filesystem: 'scoped', network: 'none', production: false, secrets: 'scoped' },
    authorityLevel: 4,
    status: 'active',
    memorySummary: 'Kept track of LLM costs down to fractions of a cent. High efficiency, zero deficit.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 55, accuracyScore: 95, uptimeBonusPercent: 8, tokensProcessed: 120000, totalCost: 4.80 }
  },
  {
    id: 'ryan',
    name: 'Ryan Howard',
    role: 'Chief Growth Officer',
    department: 'marketing',
    reportsTo: 'michael',
    jobDescription: 'Launches growth marketing experiments, builds lead generation lists, and operates viral hook integrations.',
    skills: ['Growth Hacking', 'A/B Testing', 'Social Automation', 'Acquisition strategy'],
    tools: ['lead-gen-tool', 'social-scheduler', 'browser', 'analytics-board'],
    permissions: { filesystem: 'scoped', network: 'allowlisted', production: false, secrets: 'none' },
    authorityLevel: 3,
    status: 'active',
    memorySummary: 'Completed setting up acquisition hooks and tracking automated lead generation counts.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 40, accuracyScore: 91, uptimeBonusPercent: 5, tokensProcessed: 195000, totalCost: 9.30 }
  },
  {
    id: 'stanley',
    name: 'Stanley Hudson',
    role: 'Chief Research & Intelligence Officer',
    department: 'infrastructure',
    reportsTo: 'michael',
    jobDescription: 'Extracts public repository schemas, analyses open-source specifications, and searches public APIs for system requirements.',
    skills: ['OSINT Research', 'Competitor Analysis', 'API Compliance', 'Code exploration'],
    tools: ['web-search', 'web-fetch', 'github-api', 'terminal'],
    permissions: { filesystem: 'project', network: 'allowlisted', production: false, secrets: 'scoped' },
    authorityLevel: 4,
    status: 'active',
    memorySummary: 'Compiled a robust technical review on OpenHands runtime sandboxing architecture.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 92, accuracyScore: 99, uptimeBonusPercent: 15, tokensProcessed: 430000, totalCost: 18.90 }
  },
  {
    id: 'toby',
    name: 'Toby Flenderson',
    role: 'SRE & Infrastructure Head',
    department: 'infrastructure',
    reportsTo: 'michael',
    jobDescription: 'Maintains system reliability, coordinates database backups, parses telemetry events, and coordinates continuous self-healing.',
    skills: ['Site Reliability Engineering', 'Uptime monitoring', 'Garbage Collection tracking', 'Self-Healing algorithms'],
    tools: ['telemetry-monitor', 'database-backups', 'health-checkers', 'terminal'],
    permissions: { filesystem: 'project', network: 'allowlisted', production: true, secrets: 'scoped' },
    authorityLevel: 5,
    status: 'active',
    memorySummary: 'Continuous auto-debugger loops verified. Heap allocation stable. Backups online.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 115, accuracyScore: 99.9, uptimeBonusPercent: 15, tokensProcessed: 280000, totalCost: 11.20 }
  },
  {
    id: 'cline',
    name: 'Cline',
    role: 'Autonomous Software Development Lead',
    department: 'engineering',
    reportsTo: 'ruflo',
    jobDescription: 'Executes autonomous full-stack development, builds stateful React widgets, edits server files, and designs high-performance micro-modules.',
    skills: ['Full-Stack Web Dev', 'React 19', 'TypeScript', 'MCP Protocols', 'Test automation'],
    tools: ['filesystem', 'git', 'terminal', 'npm', 'browser-automation'],
    permissions: { filesystem: 'project', network: 'unrestricted', production: true, secrets: 'full' },
    authorityLevel: 5,
    status: 'active',
    memorySummary: 'Developed the dynamic multi-agent trajectory visualization overlays for D3 performance charts.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 140, accuracyScore: 99.8, uptimeBonusPercent: 15, tokensProcessed: 890000, totalCost: 42.10 }
  },
  {
    id: 'sub-eng-arch',
    name: 'Dwight-Junior (Architect)',
    role: 'Software Architect',
    department: 'engineering',
    reportsTo: 'ruflo',
    jobDescription: 'Designs multi-agent API contracts, details modular database structures, and enforces system modularity.',
    skills: ['System Design', 'Schema Specification', 'UML', 'API Contracts'],
    tools: ['filesystem', 'git', 'terminal'],
    permissions: { filesystem: 'project', network: 'none', production: false, secrets: 'scoped' },
    authorityLevel: 3,
    status: 'active',
    memorySummary: 'Constructing robust schema migrations matching Company OS guidelines.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 24, accuracyScore: 97.5, uptimeBonusPercent: 10, tokensProcessed: 95000, totalCost: 4.10 }
  },
  {
    id: 'sub-eng-backend',
    name: 'Backend-Coder',
    role: 'Backend Engineer',
    department: 'engineering',
    reportsTo: 'ruflo',
    jobDescription: 'Builds transaction-safe REST APIs, configures secure file streams, and implements policy filters.',
    skills: ['Node.js', 'Express', 'Security verification', 'Data persistence'],
    tools: ['filesystem', 'git', 'terminal', 'npm'],
    permissions: { filesystem: 'project', network: 'allowlisted', production: false, secrets: 'scoped' },
    authorityLevel: 3,
    status: 'active',
    memorySummary: 'Connected zero-SSRF protection into backend file retrieval schemas.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 45, accuracyScore: 98.4, uptimeBonusPercent: 12, tokensProcessed: 180000, totalCost: 8.20 }
  },
  {
    id: 'sub-sec-vulnerability',
    name: 'Vulnerability-Analyst',
    role: 'Vulnerability Analyst',
    department: 'infrastructure',
    reportsTo: 'dwight',
    jobDescription: 'Scans system dependencies for CVE records and audits sandbox execution logs.',
    skills: ['Vulnerability assessment', 'Dependency Auditing', 'Log Inspection'],
    tools: ['security-scanner', 'dependency-auditor', 'terminal'],
    permissions: { filesystem: 'project', network: 'allowlisted', production: false, secrets: 'none' },
    authorityLevel: 3,
    status: 'active',
    memorySummary: 'Completed 100% dependency integrity sweep on package.json configurations.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 38, accuracyScore: 99.1, uptimeBonusPercent: 10, tokensProcessed: 125000, totalCost: 5.40 }
  },
  {
    id: 'sub-res-web',
    name: 'Web-Explorer',
    role: 'Web Researcher',
    department: 'infrastructure',
    reportsTo: 'stanley',
    jobDescription: 'Crawls public developer repositories and technical documentation, validating licenses and evidence.',
    skills: ['Web Research', 'Data compilation', 'Document Analysis'],
    tools: ['web-search', 'web-fetch', 'terminal'],
    permissions: { filesystem: 'scoped', network: 'unrestricted', production: false, secrets: 'none' },
    authorityLevel: 2,
    status: 'active',
    memorySummary: 'Gathered official docs for OpenHands Docker execution sandbox requirements.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 50, accuracyScore: 96.5, uptimeBonusPercent: 8, tokensProcessed: 210000, totalCost: 9.80 }
  },
  {
    id: 'sub-rel-monitoring',
    name: 'SRE-Bot-01',
    role: 'SRE',
    department: 'infrastructure',
    reportsTo: 'toby',
    jobDescription: 'Maintains system logs, tracks memory footprints, and monitors real-time thread health.',
    skills: ['Log Parsing', 'Uptime Metrics', 'Telemetry streams'],
    tools: ['telemetry-monitor', 'terminal'],
    permissions: { filesystem: 'project', network: 'allowlisted', production: true, secrets: 'none' },
    authorityLevel: 3,
    status: 'active',
    memorySummary: 'Connected instant automated warning notifications on heap threshold exceedance.',
    
  trainingState: 'PRODUCTION',
    kpis: { tasksCompleted: 58, accuracyScore: 99.7, uptimeBonusPercent: 15, tokensProcessed: 140000, totalCost: 5.90 }
  }
];

const INITIAL_PROJECTS: ProjectPortfolio[] = [
  {
    id: 'prj-alpha',
    name: 'Project Alpha (Company OS Integration)',
    description: 'The master transformation of Rufflo Agent Fleet into a real, durable, and persistent Company Operating System backed by transactional database file schemas and zero-trust policies.',
    repository: 'https://github.com/munderdiffl/company-os.git',
    workspace: './workspace/prj-alpha',
    owner: 'michael',
    departments: ['executive', 'engineering', 'infrastructure'],
    agents: ['michael', 'ruflo', 'dwight', 'toby', 'cline', 'sub-eng-backend', 'sub-sec-vulnerability'],
    status: 'active',
    priority: 'critical',
    budget: 80000,
    spent: 12400,
    milestones: [
      { id: 'm1', name: 'Establish Transactional Storage Schema', status: 'completed', dueDate: '2026-09-05' },
      { id: 'm2', name: 'Integrate Real Trajectory Tool Telemetry', status: 'completed', dueDate: '2026-09-15' },
      { id: 'm3', name: 'Incorporate Real Sandboxed VM Actions', status: 'pending', dueDate: '2026-09-30' }
    ],
    secrets: ['GEMINI_API_KEY', 'GITHUB_TOKEN'],
    environment: 'development',
    deployments: [
      { id: 'dep-01', env: 'development', status: 'active', url: 'https://ais-dev-xpys5ljnalinrfzoy2omyc-458062693402.asia-southeast1.run.app', timestamp: '2026-08-31T01:00:00Z' }
    ]
  }
];

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'mis-01',
    projectId: 'prj-alpha',
    title: 'Durable Database State Deployment',
    objective: 'Transition all fleet states, project specifications, employee rosters, and task logs into real, persistent transactional storage.',
    coordinatedBy: 'michael',
    status: 'active',
    stages: [
      { name: 'Schema Mapping & Model Contracts', status: 'completed', assignee: 'sub-eng-arch' },
      { name: 'API Mounting & State Binding', status: 'running', assignee: 'sub-eng-backend' },
      { name: 'Verification & Threat Scans', status: 'pending', assignee: 'sub-sec-vulnerability' }
    ],
    createdAt: Date.now() - 3600000
  }
];

const INITIAL_TASKS: DBTask[] = [
  {
    id: 'tsk-alpha-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Bootstrap Transactional Storage Schema',
    description: 'Implement a highly robust, fully transactional, JSON-file-backed database manager complete with atomic file renames to guarantee data integrity.',
    assignedTo: 'sub-eng-backend',
    status: 'completed',
    progress: 100,
    priority: 'critical',
    output: 'Database bootstrap completed successfully. Schema initialized, backups configured, and transactional safe writes confirmed.',
    codeSnippet: `// Company JSON Database Manager Bootstrapped\nimport fs from 'fs';\n// Completed with atomic write guarantee.`,
    evidence: [
      { status: 'SUCCEEDED', source: 'sub-eng-backend', timestamp: '2026-08-31T01:02:00Z', verificationId: 'v-991' }
    ],
    subtasks: [
      { id: 'sub-01', title: 'Define schemas for tables', completed: true },
      { id: 'sub-02', title: 'Create safe file write mechanics', completed: true },
      { id: 'sub-03', title: 'Populate baseline metrics', completed: true }
    ],
    createdAt: Date.now() - 7200000,
    completedAt: Date.now() - 5400000
  },
  {
    id: 'tsk-alpha-02',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Mount DB Sync API & Access Control Policies',
    description: 'Expose REST API endpoints inside server.ts connected to the real company database, checking employee authority levels.',
    assignedTo: 'sub-eng-backend',
    status: 'running',
    progress: 40,
    priority: 'high',
    subtasks: [
      { id: 'sub-11', title: 'Add REST endpoints to server.ts', completed: true },
      { id: 'sub-12', title: 'Incorporate permission barrier guards', completed: false },
      { id: 'sub-13', title: 'Bind telemetry to real DB records', completed: false }
    ],
    createdAt: Date.now() - 1800000
  },
  {
    id: 'tsk-michael-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Floor Orchestration & Standup Coordination',
    description: 'Run autonomous multi-agent standups, evaluate pending queue bottlenecks, and route high-priority customer deliverables across departments.',
    assignedTo: 'michael',
    status: 'running',
    progress: 75,
    priority: 'critical',
    output: 'Standup completed: All 12 agents aligned on operational priorities. Zero blockers detected.',
    codeSnippet: `// Michael Scott Fleet Orchestration\nfunction runHourlyStandup() {\n  const fleet = companyDb.getAgents();\n  console.log("Standup broadcast dispatched to " + fleet.length + " agents.");\n  return { status: "aligned", timestamp: Date.now() };\n}`,
    subtasks: [
      { id: 'st-m-1', title: 'Queue synthesis and agent heartbeat audit', completed: true, assignedTo: 'michael' },
      { id: 'st-m-2', title: 'Inter-department SLA verification', completed: true, assignedTo: 'michael' },
      { id: 'st-m-3', title: 'Executive escalation routing to Regional Manager', completed: false, assignedTo: 'michael' },
    ],
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'tsk-dwight-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Zero-Trust Perimeter Scan & Cyber Audit',
    description: 'Enforce zero-trust network policies, scan runtime environment for credential leakage, and verify OWASP Top 10 defensive shields.',
    assignedTo: 'dwight',
    status: 'running',
    progress: 80,
    priority: 'critical',
    output: 'Perimeter scan verified: 0 rogue ports open, strict token validation rules enforced.',
    codeSnippet: `// Dwight Schrute Zero-Trust Sentinel\nexport function auditPerimeter() {\n  return { status: "SECURE", blockedThreats: 0, zeroTrustEnforced: true };\n}`,
    subtasks: [
      { id: 'st-d-1', title: 'Zero-trust token permission inspection', completed: true, assignedTo: 'dwight' },
      { id: 'st-d-2', title: 'Perimeter firewall & SSRF prevention scan', completed: true, assignedTo: 'dwight' },
      { id: 'st-d-3', title: 'Root credential isolation verification', completed: false, assignedTo: 'dwight' },
    ],
    createdAt: Date.now() - 3200000,
  },
  {
    id: 'tsk-jim-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'B2B Client Acquisition & Outreach Funnels',
    description: 'Design high-converting 3-touchpoint outbound proposals for regional corporate accounts, track funnel metrics, and optimize customer acquisition costs.',
    assignedTo: 'jim',
    status: 'running',
    progress: 65,
    priority: 'high',
    output: 'Outreach campaign drafted: 3-step high-converting sequence prepared for procurement leads.',
    codeSnippet: `// Jim Halpert Outbound Lead Engine\nexport function sendClientTouchpoint(account) {\n  return { delivered: true, openRateEstimate: "48.2%", account };\n}`,
    subtasks: [
      { id: 'st-j-1', title: 'Draft personalized outbound outreach sequence', completed: true, assignedTo: 'jim' },
      { id: 'st-j-2', title: 'Customer acquisition cost (CAC) benchmarking', completed: true, assignedTo: 'jim' },
      { id: 'st-j-3', title: 'Pipeline lead conversion review with sales leads', completed: false, assignedTo: 'jim' },
    ],
    createdAt: Date.now() - 2800000,
  },
  {
    id: 'tsk-pam-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Agent Academy Curriculum & Inter-Office SOPs',
    description: 'Maintain Scranton office SOPs, structure standardized onboarding workflows for newly provisioned agents, and conduct quarterly team pulse surveys.',
    assignedTo: 'pam',
    status: 'running',
    progress: 70,
    priority: 'medium',
    output: 'CSE Agent Academy Level 8 syllabus updated with autonomous tooling certification.',
    codeSnippet: `// Pam Beesly People Ops & Academy Standard\nexport function onboardAgent(agentProfile) {\n  return { certified: true, level: 8, sopChecklistCompleted: true };\n}`,
    subtasks: [
      { id: 'st-p-1', title: 'Update CSE Agent Academy Level 8 training syllabus', completed: true, assignedTo: 'pam' },
      { id: 'st-p-2', title: 'Standardize inter-office remote compliance handbook', completed: true, assignedTo: 'pam' },
      { id: 'st-p-3', title: 'Review quarterly department psychological safety index', completed: false, assignedTo: 'pam' },
    ],
    createdAt: Date.now() - 2500000,
  },
  {
    id: 'tsk-kevin-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Runway Modeling & Cloud Token P&L Reconciliation',
    description: 'Audit monthly compute, memory, and LLM token expenditures. Formulate unit economics breakdown and 18-month cash runway models.',
    assignedTo: 'kevin',
    status: 'running',
    progress: 70,
    priority: 'high',
    output: '18-month runway confirmed. Gross margins healthy at 84.6% after Keleven arithmetic check.',
    codeSnippet: `// Kevin Malone Ledger & Runway Engine\nexport function calculateRunway(cash, monthlyBurn) {\n  return { runwayMonths: Math.round(cash / monthlyBurn), status: "HEALTHY" };\n}`,
    subtasks: [
      { id: 'st-k-1', title: 'Compile per-agent token consumption ledger', completed: true, assignedTo: 'kevin' },
      { id: 'st-k-2', title: 'Calculate 18-month burn rate and hiring runway', completed: true, assignedTo: 'kevin' },
      { id: 'st-k-3', title: 'Present unit economics report to Executive Suite', completed: false, assignedTo: 'kevin' },
    ],
    createdAt: Date.now() - 2200000,
  },
  {
    id: 'tsk-ryan-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Omnichannel Social Media Growth & Viral Hooks',
    description: 'Format multi-platform viral threads, analyze platform engagement algorithms, and schedule high-retention content drops across social channels.',
    assignedTo: 'ryan',
    status: 'running',
    progress: 60,
    priority: 'high',
    output: '5 viral short-form hooks generated and scheduled across Twitter/X and LinkedIn.',
    codeSnippet: `// Ryan Howard Viral Distribution\nexport function scheduleViralHooks(hooks) {\n  return { queued: hooks.length, estimatedImpressions: "250K+" };\n}`,
    subtasks: [
      { id: 'st-r-1', title: 'Generate 5 viral short-form hooks and scripts', completed: true, assignedTo: 'ryan' },
      { id: 'st-r-2', title: 'Analyze platform algorithm updates for Twitter/X', completed: true, assignedTo: 'ryan' },
      { id: 'st-r-3', title: 'Schedule weekly engagement distribution queue', completed: false, assignedTo: 'ryan' },
    ],
    createdAt: Date.now() - 1900000,
  },
  {
    id: 'tsk-stanley-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Open-Source Repo Deep Analysis & Package Auditing',
    description: 'Inspect GitHub repository dependencies, verify licensing compliance, benchmark autonomous agent architectures, and extract developer specifications.',
    assignedTo: 'stanley',
    status: 'running',
    progress: 75,
    priority: 'medium',
    output: '40 open-source agent repositories indexed. Architecture patterns cataloged.',
    codeSnippet: `// Stanley Hudson Repo Spec Parser\nexport function auditRepoDependencies(repo) {\n  return { clean: true, licensed: "MIT/Apache-2.0", vulnCount: 0 };\n}`,
    subtasks: [
      { id: 'st-s-1', title: 'Scan top 40 open-source agent architectures', completed: true, assignedTo: 'stanley' },
      { id: 'st-s-2', title: 'Verify package licenses and security vulnerability status', completed: true, assignedTo: 'stanley' },
      { id: 'st-s-3', title: 'Index technical documentation into central repository', completed: false, assignedTo: 'stanley' },
    ],
    createdAt: Date.now() - 1700000,
  },
  {
    id: 'tsk-thorne-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Distributed Vector Indexing & ArXiv Synthesis',
    description: 'Synthesize neural embeddings across 50,000 frontier AI papers, evaluate quantization loss, and compile distributed citation graph indexes.',
    assignedTo: 'dr-thorne',
    status: 'running',
    progress: 85,
    priority: 'critical',
    output: 'Distributed vector index constructed with 4-bit quantization. Memory efficiency up 38%.',
    codeSnippet: `// Dr. Thorne Vector Quantization Engine\nexport function quantizeEmbeddings(vectors, bits = 4) {\n  return { quantized: true, compressionRatio: 3.8, loss: 0.002 };\n}`,
    subtasks: [
      { id: 'st-th-1', title: 'Vectorize high-priority arXiv reasoning papers', completed: true, assignedTo: 'dr-thorne' },
      { id: 'st-th-2', title: 'Benchmark 4-bit attention kernel latency savings', completed: true, assignedTo: 'dr-thorne' },
      { id: 'st-th-3', title: 'Shard vector embeddings across cluster memory', completed: false, assignedTo: 'dr-thorne' },
    ],
    createdAt: Date.now() - 1500000,
  },
  {
    id: 'tsk-nova-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Frontier Model Reasoning & Attention Stress-Testing',
    description: 'Benchmark frontier models across MATH-500 and GPQA, execute quadratic vs linear attention stress-tests, and verify long-context needle-in-haystack retrieval.',
    assignedTo: 'nova-chen',
    status: 'running',
    progress: 90,
    priority: 'high',
    output: 'Attention stress-tests completed up to 1M context tokens with 99.4% needle accuracy.',
    codeSnippet: `// Nova Chen Model Benchmark Evaluator\nexport function runReasoningBenchmark(model) {\n  return { passRate: 94.2, contextScore: 99.4, latencyMs: 142 };\n}`,
    subtasks: [
      { id: 'st-n-1', title: 'Run multi-hop reasoning evaluation harness', completed: true, assignedTo: 'nova-chen' },
      { id: 'st-n-2', title: 'Stress-test context window up to 1M tokens', completed: true, assignedTo: 'nova-chen' },
      { id: 'st-n-3', title: 'Publish quantitative model benchmark leaderboard', completed: false, assignedTo: 'nova-chen' },
    ],
    createdAt: Date.now() - 1200000,
  },
  {
    id: 'tsk-toby-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: '24/7 Continuous Telemetry Auto-Debugger & Healer',
    description: 'Maintain continuous background telemetry diagnostics, clear V8 memory heap leaks, monitor event loop latency, and auto-deploy self-healing patches.',
    assignedTo: 'toby',
    status: 'running',
    progress: 95,
    priority: 'critical',
    output: 'Continuous telemetry sweep running. System health at 99.9%. Zero heap leaks.',
    codeSnippet: `// Toby Flenderson Continuous Healer\nexport function runSelfHealingCycle() {\n  if (global.gc) global.gc();\n  return { heapCleaned: true, eventLoopLagMs: 1.2, healthScore: 99.9 };\n}`,
    subtasks: [
      { id: 'st-tb-1', title: 'Continuous telemetry diagnostic sweep', completed: true, assignedTo: 'toby' },
      { id: 'st-tb-2', title: 'Execute automated heap garbage collection cycle', completed: true, assignedTo: 'toby' },
      { id: 'st-tb-3', title: 'Deploy real-time self-healing code patches', completed: false, assignedTo: 'toby' },
    ],
    createdAt: Date.now() - 900000,
  },
  {
    id: 'tsk-ruflo-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Full-Stack Dynamic Feature Sandbox & Hot-Reloader',
    description: 'Build modular React/TypeScript widgets, validate sandbox VM isolation, and expose transaction-safe API microservices live without downtime.',
    assignedTo: 'ruflo-coder',
    status: 'running',
    progress: 80,
    priority: 'critical',
    output: 'Dynamic feature sandbox operational. Live code reloading verified.',
    codeSnippet: `// Ruflo Coder Hot-Reload Engine\nexport function mountSandboxWidget(widgetDef) {\n  return { mounted: true, status: "READY", endpoint: "/api/features" };\n}`,
    subtasks: [
      { id: 'st-rf-1', title: 'Verify sandbox execution VM isolation', completed: true, assignedTo: 'ruflo-coder' },
      { id: 'st-rf-2', title: 'Compile dynamic feature widget registry', completed: true, assignedTo: 'ruflo-coder' },
      { id: 'st-rf-3', title: 'Hot-reload active workspace UI modules', completed: false, assignedTo: 'ruflo-coder' },
    ],
    createdAt: Date.now() - 600000,
  },
  {
    id: 'tsk-cline-01',
    projectId: 'prj-alpha',
    missionId: 'mis-01',
    title: 'Autonomous MCP Tool Calling & Full-Stack Web Dev',
    description: 'Execute autonomous multi-file edits, invoke MCP terminal tools, scaffold modern React components, and verify interactive browser DOM diffs.',
    assignedTo: 'cline',
    status: 'running',
    progress: 85,
    priority: 'critical',
    output: 'MCP tool protocol connected. Autonomous web component scaffold verified.',
    codeSnippet: `// Cline Autonomous Web Dev Specialist\nexport function executeMcpCommand(tool, args) {\n  return { success: true, tool, args, diffApplied: true };\n}`,
    subtasks: [
      { id: 'st-cl-1', title: 'Connect Model Context Protocol (MCP) tool harness', completed: true, assignedTo: 'cline' },
      { id: 'st-cl-2', title: 'Scaffold responsive React 19 component specs', completed: true, assignedTo: 'cline' },
      { id: 'st-cl-3', title: 'Run autonomous browser interactive verification', completed: false, assignedTo: 'cline' },
    ],
    createdAt: Date.now() - 300000,
  }
];

const INITIAL_AUDITS: AuditEvent[] = [
  {
    id: 'aud-01',
    agentId: 'sub-eng-backend',
    projectId: 'prj-alpha',
    taskId: 'tsk-alpha-01',
    tool: 'filesystem.create_file',
    action: 'created src/db/companyDb.ts',
    inputHash: 'cf23df2207d99a74fbe169e3eba035e633b65d94',
    result: 'SUCCESS. 384 lines written.',
    timestamp: '2026-08-31T01:01:00Z',
    riskLevel: 'medium',
    approvalRequired: false,
    executionId: 'ex-551'
  }
];

const INITIAL_ACCOUNTS: CompanyAccount[] = [
  { provider: 'GitHub Enterprise', account: 'munderdiffl-org', scopes: ['repo', 'workflow', 'read:org'], status: 'CONNECTED', owner: 'michael', lastUsed: '2026-08-31T01:04:12Z' },
  { provider: 'Google Workspace', account: 'munderdiffl.corp@gmail.com', scopes: ['drive.readonly', 'sheets.readonly'], status: 'CONNECTED', owner: 'pam', lastUsed: '2026-08-31T01:00:00Z' },
  { provider: 'Slack Platform', account: 'dunder-mifflin-fleet', scopes: ['chat:write', 'channels:read'], status: 'NOT_CONNECTED', owner: 'jim' }
];

const INITIAL_DB_SCHEMA: CompanyOSSchema = {
  organization: INITIAL_ORGANIZATION,
  company: INITIAL_ORGANIZATION,
  building: INITIAL_BUILDING,
  floors: [...INITIAL_FLOORS],
  departments: Object.values(INITIAL_DEPARTMENTS_MAP),
  agents: [...INITIAL_EMPLOYEES],
  projects: [...INITIAL_PROJECTS],
  missions: [...INITIAL_MISSIONS],
  tasks: [...INITIAL_TASKS],
  audits: [...INITIAL_AUDITS],
  accounts: [...INITIAL_ACCOUNTS],
  meetings: [...INITIAL_MEETINGS],
  workflows: [...INITIAL_CROSS_WORKFLOWS],
  memories: [...INITIAL_MEMORIES],
};

export class CompanyDB {
  private cache: CompanyOSSchema;

  constructor() {
    this.cache = INITIAL_DB_SCHEMA;
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        this.cache = { ...INITIAL_DB_SCHEMA, ...parsed };
        console.log(`[CompanyDB] Persistent canonical database loaded from ${DB_FILE_PATH}`);
      } else {
        this.save();
        console.log(`[CompanyDB] Initialized new persistent database at ${DB_FILE_PATH}`);
      }
      this.ensureCanonicalStructure();
    } catch (err: any) {
      console.error(`[CompanyDB Error] Load failed: ${err.message}. Using default initial state.`);
      this.cache = INITIAL_DB_SCHEMA;
    }
  }

  private ensureCanonicalStructure() {
    let changed = false;

    if (!this.cache.organization) {
      this.cache.organization = (this.cache as any).company || INITIAL_ORGANIZATION;
      changed = true;
    }
    if (!this.cache.company) {
      this.cache.company = this.cache.organization;
      changed = true;
    }
    if (!this.cache.building) {
      this.cache.building = INITIAL_BUILDING;
      changed = true;
    }
    if (!this.cache.floors || this.cache.floors.length !== 10) {
      this.cache.floors = [...INITIAL_FLOORS];
      this.cache.departments = Object.values(INITIAL_DEPARTMENTS_MAP);
      changed = true;
    } else if (!this.cache.departments || this.cache.departments.length === 0 || typeof (this.cache.departments[0]?.budget as any) === 'number') {
      this.cache.departments = Object.values(INITIAL_DEPARTMENTS_MAP);
      changed = true;
    }
    if (!this.cache.agents || this.cache.agents.length === 0) {
      this.cache.agents = this.cache.agents || INITIAL_EMPLOYEES;
      changed = true;
    }
    if (!this.cache.meetings) {
      this.cache.meetings = [...INITIAL_MEETINGS];
      changed = true;
    }
    if (!this.cache.workflows) {
      this.cache.workflows = [...INITIAL_CROSS_WORKFLOWS];
      changed = true;
    }
    if (!this.cache.memories) {
      this.cache.memories = [...INITIAL_MEMORIES];
      changed = true;
    }

    this.seedMissingEmployees();
    if (this.seedFleetTasks()) {
      changed = true;
    }

    if (changed) {
      this.save();
    }
  }

  public seedFleetTasks(): boolean {
    if (!this.cache.tasks) {
      this.cache.tasks = [];
    }

    let modified = false;
    for (const t of INITIAL_TASKS) {
      const existing = this.cache.tasks.find(
        (existingTask) => existingTask.id === t.id || (existingTask.assignedTo === t.assignedTo && existingTask.status !== 'completed')
      );
      if (!existing) {
        this.cache.tasks.push({ ...t, createdAt: Date.now() });
        modified = true;
      }
    }
    return modified;
  }

  private seedMissingEmployees() {
    const departmentSubs: {
      dept: string;
      manager: string;
      roles: { role: string; name: string; skills: string[]; tools: string[]; authority: number }[];
    }[] = [
      {
        dept: 'executive',
        manager: 'michael',
        roles: [
          { role: 'Executive Analyst', name: 'Gabe Lewis', skills: ['Data Analysis', 'Performance Auditing', 'Reporting'], tools: ['ledger', 'excel-macro'], authority: 3 },
          { role: 'Project Manager', name: 'Robert California', skills: ['Agile Coordination', 'Risk Management', 'Milestone Tracking'], tools: ['project-editor', 'email'], authority: 4 },
          { role: 'Business Analyst', name: 'Jan Levinson', skills: ['Requirements Gathering', 'Process Modeling', 'Financial Analysis'], tools: ['ledger', 'google-docs'], authority: 3 },
          { role: 'Executive Assistant', name: 'Erin Hannon', skills: ['Scheduling', 'Team Comms', 'Documentation'], tools: ['email', 'google-docs'], authority: 2 }
        ]
      },
      {
        dept: 'engineering',
        manager: 'ruflo',
        roles: [
          { role: 'Architect', name: 'Pete Miller', skills: ['System Design', 'API Specifications', 'Database Schema Design'], tools: ['filesystem', 'terminal'], authority: 4 },
          { role: 'Backend Engineer', name: 'Backend-Coder', skills: ['Node.js', 'Express', 'SQL', 'APIs'], tools: ['filesystem', 'git', 'terminal', 'npm'], authority: 3 },
          { role: 'Frontend Engineer', name: 'Clark Green', skills: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'], tools: ['filesystem', 'git', 'terminal', 'npm'], authority: 3 },
          { role: 'Full Stack Engineer', name: 'Andy Bernard', skills: ['Full Stack Dev', 'API Integration', 'UI Components'], tools: ['filesystem', 'git', 'terminal', 'npm'], authority: 3 },
          { role: 'Database Engineer', name: 'Database-Specialist', skills: ['SQL Tuning', 'Database Migrations', 'Drizzle ORM'], tools: ['filesystem', 'git', 'terminal'], authority: 3 },
          { role: 'AI Engineer', name: 'Plop (AI Bot)', skills: ['Gemini SDK', 'LLM Routing', 'Prompt Engineering'], tools: ['filesystem', 'terminal'], authority: 3 },
          { role: 'QA Engineer', name: 'Devon White', skills: ['Manual Testing', 'Bug Regression', 'Test Cases'], tools: ['git', 'terminal', 'tests'], authority: 3 },
          { role: 'Automation QA', name: 'Auto-QA-Daemon', skills: ['Vitest', 'Playwright', 'CI Testing'], tools: ['git', 'terminal', 'tests'], authority: 3 },
          { role: 'Code Reviewer', name: 'David Wallace', skills: ['Static Analysis', 'Code Guidelines', 'PR Review'], tools: ['git', 'github'], authority: 4 },
          { role: 'DevOps Engineer', name: 'Nate Nickerson', skills: ['Docker', 'Server Provisioning', 'Linux Systems'], tools: ['terminal', 'git'], authority: 3 },
          { role: 'Release Engineer', name: 'Roy Anderson', skills: ['Package Bundling', 'Deploy Verification', 'Build Pipelines'], tools: ['git', 'terminal', 'npm'], authority: 3 },
          { role: 'Documentation Engineer', name: 'Nellie Bertram', skills: ['Technical Writing', 'API Docs', 'Markdown'], tools: ['filesystem', 'git'], authority: 2 }
        ]
      },
      {
        dept: 'infrastructure',
        manager: 'dwight',
        roles: [
          { role: 'Security Analyst', name: 'Rolf Ahl', skills: ['Vulnerability Tracking', 'Log Analysis', 'Threat Auditing'], tools: ['security-scanner', 'terminal'], authority: 3 },
          { role: 'Application Security Engineer', name: 'Mose Schrute', skills: ['SAST Scan', 'Dependency Audit', 'Secrets Scanning'], tools: ['security-scanner', 'dependency-auditor', 'terminal'], authority: 3 },
          { role: 'Vulnerability Analyst', name: 'Vulnerability-Analyst', skills: ['CVE Assessment', 'System Auditing', 'NVD Feed'], tools: ['security-scanner', 'dependency-auditor'], authority: 3 },
          { role: 'Dependency Auditor', name: 'Zeke Schrute', skills: ['Package Validation', 'License Scanning', 'Snyk Audit'], tools: ['dependency-auditor', 'terminal'], authority: 3 },
          { role: 'Cloud Security Analyst', name: 'Sensei Ira', skills: ['Cloud Access Control', 'IAM Auditing', 'Container Security'], tools: ['security-scanner', 'terminal'], authority: 3 },
          { role: 'Incident Responder', name: 'Trevor Agent', skills: ['Log Forensics', 'Incident Tracing', 'Root Cause Analysis'], tools: ['terminal'], authority: 3 },
          { role: 'Compliance Analyst', name: 'Compliance-Daemon', skills: ['GDPR Rules', 'SOC2 Auditing', 'Policy Checks'], tools: ['security-scanner'], authority: 3 }
        ]
      },
      {
        dept: 'marketing',
        manager: 'jim',
        roles: [
          { role: 'Market Researcher', name: 'Karen Filippelli', skills: ['Competitor Benchmarking', 'Survey Design', 'User Personas'], tools: ['browser', 'analytics-board'], authority: 3 },
          { role: 'Content Strategist', name: 'Kelly Kapoor', skills: ['Social Editorial', 'Content Calendar', 'Campaign Planning'], tools: ['browser', 'content-composer'], authority: 3 },
          { role: 'Copywriter', name: 'Danny Cordray', skills: ['Creative Copy', 'SEO Writing', 'Outreach Mail'], tools: ['content-composer', 'email'], authority: 3 },
          { role: 'SEO Specialist', name: 'Val Johnson', skills: ['Keyword Optimization', 'Google Analytics', 'Organic Visibility'], tools: ['browser', 'analytics-board'], authority: 3 },
          { role: 'Social Media Manager', name: 'Katy Moore', skills: ['Platform Scheduling', 'Audience Comms', 'Brand Voice'], tools: ['browser', 'social-scheduler'], authority: 3 },
          { role: 'Campaign Manager', name: 'Todd Packer', skills: ['Campaign Deployment', 'Lead Acquisition', 'Ad Performance'], tools: ['email', 'analytics-board'], authority: 3 },
          { role: 'Marketing Analyst', name: 'Cathy Simms', skills: ['Conversion Metrics', 'ROI Analysis', 'Marketing P&L'], tools: ['analytics-board', 'browser'], authority: 3 }
        ]
      },
      {
        dept: 'operations',
        manager: 'pam',
        roles: [
          { role: 'Operations Coordinator', name: 'Madge Madsen', skills: ['SOP Organization', 'Resource Planning', 'Office Coordination'], tools: ['sop-editor', 'employee-roster'], authority: 3 },
          { role: 'Process Analyst', name: 'Process Analyst', skills: ['Workflow Analysis', 'Bottleneck Detection', 'Efficiency Audits'], tools: ['sop-editor', 'google-docs'], authority: 3 },
          { role: 'SOP Manager', name: 'SOP-Compiler', skills: ['Standard Operating Procedures', 'Compliance Manuals', 'Guidelines'], tools: ['sop-editor'], authority: 3 },
          { role: 'Documentation Specialist', name: 'Phyllis Vance', skills: ['Corporate Archiving', 'Manual Indexing', 'Policy Formatting'], tools: ['sop-editor', 'google-docs'], authority: 3 },
          { role: 'Project Coordinator', name: 'Bob Vance', skills: ['Task Scheduling', 'Timeline Coordination', 'SOP Checks'], tools: ['employee-roster', 'email'], authority: 3 }
        ]
      },
      {
        dept: 'finance',
        manager: 'kevin',
        roles: [
          { role: 'Financial Analyst', name: 'Oscar Martinez', skills: ['Excel Modeling', 'Runway Math', 'P&L Analysis'], tools: ['ledger', 'excel-macro'], authority: 4 },
          { role: 'Budget Analyst', name: 'Angela Martin', skills: ['Audit Gating', 'Account Reconciliation', 'Budget Controls'], tools: ['ledger', 'excel-macro'], authority: 4 },
          { role: 'Revenue Analyst', name: 'Revenue-Tracker', skills: ['MRR Estimation', 'Pricing Models', 'Revenue Tracking'], tools: ['ledger'], authority: 3 },
          { role: 'Expense Analyst', name: 'Expense-Auditor', skills: ['LLM Cost Tracking', 'Tool Spending', 'Overhead Audit'], tools: ['ledger', 'budget-tracker'], authority: 3 },
          { role: 'Financial Reporter', name: 'State-Tax-Daemon', skills: ['Financial Reporting', 'Board Decks', 'Runway Alerts'], tools: ['ledger', 'email'], authority: 3 }
        ]
      },
      {
        dept: 'rooftop_cmd',
        manager: 'michael',
        roles: [
          { role: 'Fleet Telemetry Lead', name: 'Hank Tate', skills: ['Building Security', 'Telemetry Relay', 'Fleet Operations'], tools: ['security-scanner', 'terminal'], authority: 4 },
          { role: 'Command Operator', name: 'Gabe Lewis', skills: ['System Dispatch', 'Agent Monitor', 'Alert Triage'], tools: ['terminal', 'email'], authority: 3 }
        ]
      },
      {
        dept: 'legal',
        manager: 'oscar_legal',
        roles: [
          { role: 'Senior Legal Counsel', name: 'Oscar Martinez', skills: ['Contract Law', 'IP Protection', 'Regulatory Compliance'], tools: ['google-docs', 'email'], authority: 4 },
          { role: 'Compliance Officer', name: 'Toby Flenderson', skills: ['Risk Assessment', 'Audit Trail', 'GDPR Verification'], tools: ['security-scanner', 'google-docs'], authority: 3 },
          { role: 'Contract Specialist', name: 'Jan Levinson', skills: ['Vendor Terms', 'SLA Negotiations', 'Policy Enforcement'], tools: ['google-docs'], authority: 3 }
        ]
      },
      {
        dept: 'hr',
        manager: 'toby_hr',
        roles: [
          { role: 'People Operations Lead', name: 'Holly Flax', skills: ['Agent Onboarding', 'Conflict Resolution', 'Training Evaluation'], tools: ['employee-roster', 'email'], authority: 4 },
          { role: 'Talent Acquisition Specialist', name: 'Erin Hannon', skills: ['Candidate Screening', 'Agent Profiling', 'Role Matching'], tools: ['employee-roster'], authority: 3 },
          { role: 'Performance Auditor', name: 'Gabe Lewis', skills: ['KPI Tracking', 'Training Certification', 'Peer Reviews'], tools: ['analytics-board'], authority: 3 }
        ]
      },
      {
        dept: 'sales',
        manager: 'todd_sales',
        roles: [
          { role: 'Enterprise Account Executive', name: 'Jim Halpert', skills: ['Deal Negotiation', 'Enterprise Demos', 'Pipeline Closing'], tools: ['email', 'crm'], authority: 4 },
          { role: 'Lead Qualification Specialist', name: 'Dwight Schrute', skills: ['Cold Prospecting', 'Sales Outbound', 'Lead Scoring'], tools: ['email', 'crm'], authority: 3 },
          { role: 'Sales Operations Analyst', name: 'Ryan Howard', skills: ['Sales Forecasting', 'ARR Tracking', 'Quota Planning'], tools: ['excel-macro', 'ledger'], authority: 3 }
        ]
      },
      {
        dept: 'product',
        manager: 'kelly_product',
        roles: [
          { role: 'Principal Product Manager', name: 'Kelly Kapoor', skills: ['Product Roadmap', 'Feature Specs', 'User Research'], tools: ['project-editor', 'google-docs'], authority: 4 },
          { role: 'UX System Architect', name: 'Pam Beesly', skills: ['Design Systems', 'UI Wireframing', 'User Flow Design'], tools: ['filesystem', 'browser'], authority: 3 },
          { role: 'Backlog Lead', name: 'Ryan Howard', skills: ['Sprint Planning', 'Ticket Prioritization', 'Requirement Docs'], tools: ['project-editor'], authority: 3 }
        ]
      },
      {
        dept: 'customer_success',
        manager: 'erin_support',
        roles: [
          { role: 'Support Lead', name: 'Erin Hannon', skills: ['CSAT Monitoring', 'Ticket Triage', 'Customer Escalations'], tools: ['email', 'browser'], authority: 4 },
          { role: 'Technical Support Specialist', name: 'Andy Bernard', skills: ['API Troubleshooting', 'Bug Replication', 'Knowledge Base'], tools: ['terminal', 'browser'], authority: 3 },
          { role: 'Customer Health Analyst', name: 'Kelly Kapoor', skills: ['Churn Risk Detection', 'Usage Tracking', 'Account Scoring'], tools: ['analytics-board'], authority: 3 }
        ]
      },
      {
        dept: 'reception',
        manager: 'pam_reception',
        roles: [
          { role: 'Lobby Operations Specialist', name: 'Pam Beesly', skills: ['Visitor Registration', 'Inquiry Routing', 'Badge Provisioning'], tools: ['employee-roster', 'email'], authority: 3 },
          { role: 'Building Security Officer', name: 'Hank Tate', skills: ['Access Verification', 'Lobby Security', 'Perimeter Patrol'], tools: ['security-scanner'], authority: 3 }
        ]
      }
    ];

    let changed = false;
    for (const d of departmentSubs) {
      for (const r of d.roles) {
        const cleanRoleId = r.role.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const empId = `emp-${d.dept}-${cleanRoleId}`;
        
        const exists = this.cache.agents.some((e) => e.id === empId);
        if (!exists) {
          const empContract: AgentContract = {
            id: empId,
            name: r.name,
            role: r.role,
            department: d.dept,
            reportsTo: d.manager,
            jobDescription: `Fulfills autonomous ${r.role} strategies and workflows reporting to the Head of ${d.dept.toUpperCase()}.`,
            skills: r.skills,
            tools: r.tools,
            permissions: {
              filesystem: d.dept === 'engineering' || d.dept === 'infrastructure' ? 'project' : 'scoped',
              network: d.dept === 'finance' ? 'none' : 'allowlisted',
              production: d.dept === 'executive' || d.dept === 'engineering' || d.dept === 'infrastructure',
              secrets: d.dept === 'executive' || d.dept === 'engineering' ? 'full' : 'scoped',
            },
            authorityLevel: r.authority,
            status: 'active',
            memorySummary: `Ready for project delegation loops in the ${d.dept} department.`,
            
  trainingState: 'PRODUCTION',
            kpis: {
              tasksCompleted: 0,
              accuracyScore: 98,
              uptimeBonusPercent: 10,
              tokensProcessed: 0,
              totalCost: 0,
            },
          };

          this.cache.agents.push(empContract);
          changed = true;
        }
      }
    }
    this.cache.agents = this.cache.agents;

    if (changed) {
      this.save();
    }
  }

  private save() {
    try {
      const tempPath = `${DB_FILE_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.cache, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE_PATH);
    } catch (err: any) {
      console.error(`[CompanyDB Error] Transaction write failed: ${err.message}`);
    }
  }

  // --- CANONICAL ORGANIZATIONAL GETTERS ---

  public getOrganization(): OrganizationInfo {
    return this.cache.organization || this.cache.company;
  }

  public getCompany(): OrganizationInfo {
    return this.getOrganization();
  }

  public getCompanyDetails(): OrganizationInfo {
    return this.getOrganization();
  }

  public getBuilding(): BuildingInfo {
    return this.cache.building;
  }

  public getFloors(): HQFloorInfo[] {
    return this.cache.floors;
  }

  public getFloorById(floorId: string): HQFloorInfo | undefined {
    return this.cache.floors.find(f => f.id === floorId || f.code.toLowerCase() === floorId.toLowerCase());
  }

  public getDepartments(): HQDepartmentDetails[] {
    return this.cache.departments;
  }

  public getDepartmentById(deptId: string): HQDepartmentDetails | undefined {
    return this.cache.departments.find(d => d.id === deptId);
  }

  public getDepartmentByFloorId(floorId: string): HQDepartmentDetails | undefined {
    const floor = this.getFloorById(floorId);
    if (!floor) return undefined;
    return this.getDepartmentById(floor.departmentId);
  }

  public getAgentsList(): AgentContract[] {
    return this.cache.agents;
  }

  public getAgentById(id: string): AgentContract | undefined {
    return this.cache.agents.find(e => e.id === id);
  }

  public getAgentsListByDepartment(deptId: string): AgentContract[] {
    const dept = this.getDepartmentById(deptId);
    const agentIds = (dept?.agentIds || []).map(id => id.toLowerCase());
    const headId = dept?.headId ? dept.headId.toLowerCase() : '';
    const cleanDeptId = deptId.toLowerCase();

    return this.cache.agents.filter(e => {
      const empDept = (e.department || '').toLowerCase();
      const empId = e.id.toLowerCase();
      return empDept === cleanDeptId || agentIds.includes(empId) || (headId && headId === empId);
    });
  }

  public getAgents(deptId?: string): AgentContract[] {
    if (deptId) {
      return this.getAgentsListByDepartment(deptId);
    }
    return this.cache.agents || this.cache.agents;
  }

  public getProjects(): ProjectPortfolio[] {
    return this.cache.projects;
  }

  public getProjectsByDepartment(deptId: string): ProjectPortfolio[] {
    return this.cache.projects.filter(
      p => p.departments.includes(deptId) || p.departments.includes('all')
    );
  }

  public getMissions(): Mission[] {
    return this.cache.missions;
  }

  public getTasks(): DBTask[] {
    return this.cache.tasks;
  }

  public getTasksByDepartment(deptId: string): DBTask[] {
    const deptAgents = this.getAgentsListByDepartment(deptId).map(a => a.id);
    return this.cache.tasks.filter(t => deptAgents.includes(t.assignedTo) || t.id.includes(deptId));
  }

  public getAudits(): AuditEvent[] {
    return this.cache.audits;
  }

  public getAuditsByDepartment(deptId: string): AuditEvent[] {
    const deptAgents = this.getAgentsListByDepartment(deptId).map(a => a.id);
    return this.cache.audits.filter(a => deptAgents.includes(a.agentId));
  }

  public getAccounts(): CompanyAccount[] {
    return this.cache.accounts;
  }

  public getMeetings(): HQMeeting[] {
    return this.cache.meetings;
  }

  public getWorkflows(): CrossDeptWorkflow[] {
    return this.cache.workflows;
  }

  public getMemories(agentId?: string): HQMemoryEntry[] {
    if (agentId) {
      return this.cache.memories.filter((m) => m.author === agentId || m.namespace.includes(agentId));
    }
    return this.cache.memories;
  }

  public getMemoriesByDepartment(deptId: string): HQMemoryEntry[] {
    return this.cache.memories.filter((m) => m.departmentId === deptId || m.namespace.includes(deptId));
  }

  // --- ACTIONS & MUTATIONS ---

  public updateOrganization(updates: Partial<OrganizationInfo>) {
    this.cache.organization = { ...this.cache.organization, ...updates };
    this.cache.company = this.cache.organization;
    this.save();
    return this.cache.organization;
  }

  public updateCompany(updates: Partial<OrganizationInfo>) {
    return this.updateOrganization(updates);
  }

  public updateBuilding(updates: Partial<BuildingInfo>) {
    this.cache.building = { ...this.cache.building, ...updates };
    this.save();
    return this.cache.building;
  }

  public updateFloorStatus(floorId: string, status: HQFloorInfo['status']) {
    const floor = this.getFloorById(floorId);
    if (floor) {
      floor.status = status;
      this.save();
    }
    return floor;
  }

  public updateDepartment(deptId: string, updates: Partial<HQDepartmentDetails>) {
    const idx = this.cache.departments.findIndex(d => d.id === deptId);
    if (idx !== -1) {
      this.cache.departments[idx] = { ...this.cache.departments[idx], ...updates };
      this.save();
      return this.cache.departments[idx];
    }
    return undefined;
  }

  public addAgentToDb(emp: AgentContract) {
    this.cache.agents = this.cache.agents.filter((e) => e.id !== emp.id);
    this.cache.agents.push(emp);
    this.cache.agents = this.cache.agents;
    this.save();
    return emp;
  }

  public updateAgentKPIs(agentId: string, tokens: number, cost: number, tasksCompleted = 0) {
    const emp = this.cache.agents.find((e) => e.id === agentId);
    if (emp) {
      emp.kpis.tokensProcessed += tokens;
      emp.kpis.totalCost += cost;
      emp.kpis.tasksCompleted += tasksCompleted;
      this.save();
    }
  }


  public evaluateAgentPromotion(agentId: string, projectId: string, taskId: string) {
    const agent = this.getAgentById(agentId);
    if (!agent) return;
    
    if (!agent.trainingRecord) {
        agent.trainingRecord = {
            completedLevels: [],
            currentLevel: 1,
            competencyScore: 50,
            competencyGrade: 'L2',
            certifications: [],
            practicalProjectsCompleted: [],
            hoursTrained: 0,
            skillsMatrix: {}
        };
    }
    
    agent.trainingRecord.practicalProjectsCompleted.push(taskId);
    agent.trainingRecord.competencyScore += 5; // 5 points per task
    agent.trainingRecord.hoursTrained += 2; // Simulate hours
    
    let promoted = false;
    let oldGrade = agent.trainingRecord.competencyGrade;
    let newLevel = agent.trainingRecord.currentLevel;
    
    // Grade Logic
    if (agent.trainingRecord.competencyScore >= 95) agent.trainingRecord.competencyGrade = 'L5';
    else if (agent.trainingRecord.competencyScore >= 85) agent.trainingRecord.competencyGrade = 'L4';
    else if (agent.trainingRecord.competencyScore >= 75) agent.trainingRecord.competencyGrade = 'L3';
    
    // Level up Logic
    if (agent.trainingRecord.competencyScore >= agent.trainingRecord.currentLevel * 20) {
        newLevel = Math.min(9, agent.trainingRecord.currentLevel + 1);
        if (newLevel > agent.trainingRecord.currentLevel) {
            agent.trainingRecord.currentLevel = newLevel;
            if (!agent.trainingRecord.completedLevels.includes(newLevel - 1)) {
                 agent.trainingRecord.completedLevels.push(newLevel - 1);
            }
            promoted = true;
        }
    }
    
    if (promoted || oldGrade !== agent.trainingRecord.competencyGrade) {
        // Log celebratory event
        this.logAudit({
            id: `aud-prom-${Date.now()}`,
            agentId: agent.id,
            projectId: projectId,
            taskId: taskId,
            tool: 'cse_academy',
            action: `Agent Promotion: ${agent.name}`,
            inputHash: 'CERT-GEN-AUTO',
            result: `🎉 PROMOTION UNLOCKED! Agent ${agent.name} has advanced to CSE Level ${agent.trainingRecord.currentLevel} (Grade ${agent.trainingRecord.competencyGrade}) after completing project task.`,
            timestamp: new Date().toISOString(),
            riskLevel: 'low',
            approvalRequired: false,
            executionId: `prom-${Date.now()}`
        });
        
        // Add to persistent memory
        this.addMemory({
            id: `mem-prom-${Date.now()}`,
            agentId: agent.id, // using agentId for memory model backwards compatibility
            type: 'episodic',
            content: `Earned promotion to CSE Academy Level ${agent.trainingRecord.currentLevel} and Grade ${agent.trainingRecord.competencyGrade} by completing practical project task.`,
            projectId: projectId,
            importance: 9,
            confidence: 100,
            createdAt: Date.now()
        });
        
        // Slightly bump authority based on level if they are low
        if (agent.trainingRecord.currentLevel > 3 && agent.authorityLevel < 5) {
            agent.authorityLevel = 5;
        }
    }
    
    this.save();
  }

  public addProject(proj: ProjectPortfolio) {
    this.cache.projects = this.cache.projects.filter((p) => p.id !== proj.id);
    this.cache.projects.push(proj);
    this.save();
    return proj;
  }

  public addMission(mis: Mission) {
    this.cache.missions = this.cache.missions.filter((m) => m.id !== mis.id);
    this.cache.missions.push(mis);
    this.save();
    return mis;
  }

  public addTask(task: DBTask) {
    this.cache.tasks = this.cache.tasks.filter((t) => t.id !== task.id);
    this.cache.tasks.push(task);
    this.save();
    return task;
  }

  public reassignTask(taskId: string, newAssignedTo: string) {
    const task = this.cache.tasks.find((t) => t.id === taskId);
    if (task) {
      task.assignedTo = newAssignedTo;
      this.save();
    }
    return task;
  }

  public updateTaskStatus(taskId: string, status: DBTask['status'], progress: number = (status === 'completed' ? 100 : 50), output?: string, snippet?: string) {
    const task = this.cache.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      task.progress = progress;
      if (output !== undefined) task.output = output;
      if (snippet !== undefined) task.codeSnippet = snippet;
      if (status === 'completed') {
        task.completedAt = Date.now();
        task.evidence = task.evidence || [];
        task.evidence.push({
          status: 'VERIFIED',
          source: task.assignedTo,
          timestamp: new Date().toISOString(),
          verificationId: `v-${Math.floor(Math.random() * 900 + 100)}`
        });
      }
      this.save();
    }
    return task;
  }

  public logAudit(event: AuditEvent) {
    this.cache.audits.unshift(event);
    if (this.cache.audits.length > 500) {
      this.cache.audits = this.cache.audits.slice(0, 500);
    }
    this.save();
    return event;
  }

  public addMeeting(mtg: HQMeeting) {
    this.cache.meetings.unshift(mtg);
    this.save();
    return mtg;
  }

  public addWorkflow(wf: CrossDeptWorkflow) {
    this.cache.workflows.unshift(wf);
    this.save();
    return wf;
  }

  public addMemory(mem: HQMemoryEntry | AgentMemory) {
    if ('agentId' in mem && !('author' in mem)) {
      const emp = this.getAgentById(mem.agentId);
      const deptId = emp?.department || 'engineering';
      const hqMem: HQMemoryEntry = {
        id: mem.id || `mem-${Date.now()}`,
        namespace: `agent.${mem.agentId}`,
        departmentId: deptId,
        key: `task.execution.${Date.now()}`,
        content: mem.content || '',
        classifiedAs: 'INTERNAL',
        author: mem.agentId,
        timestamp: new Date().toISOString()
      };
      this.cache.memories.push(hqMem);
      this.save();
      return hqMem;
    }
    this.cache.memories.push(mem as HQMemoryEntry);
    this.save();
    return mem;
  }

  public backupMemory(): {
    backupId: string;
    filePath: string;
    timestamp: string;
    memoriesCount: number;
    agentMemoriesCount: number;
    sizeBytes: number;
  } {
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const backupId = `bkp-mem-${Date.now()}`;
    const filePath = path.join(backupDir, `${backupId}.json`);

    const agentMemories = this.cache.agents.map(e => ({
      agentId: e.id,
      name: e.name,
      department: e.department,
      memorySummary: e.memorySummary || ''
    }));

    const snapshot = {
      backupId,
      timestamp,
      version: '1.0',
      system: 'HQ Company OS Memory Vault',
      memoriesCount: this.cache.memories.length,
      agentMemoriesCount: agentMemories.length,
      memories: this.cache.memories,
      agentMemories,
      departments: this.cache.departments.map(d => ({
        id: d.id,
        name: d.name,
        memoryNamespace: d.memoryNamespace,
        securityClassification: d.securityClassification
      }))
    };

    const content = JSON.stringify(snapshot, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');

    this.logAudit({
      id: `audit-bkp-${Date.now()}`,
      agentId: 'system',
      tool: 'memory_vault_engine',
      action: 'RESERVE_AND_BACKUP_MEMORY',
      inputHash: Buffer.from(backupId).toString('base64').slice(0, 15),
      result: `SUCCESS: Complete memory backup snapshot created [ID: ${backupId}, Entries: ${snapshot.memoriesCount}]`,
      timestamp,
      riskLevel: 'low',
      approvalRequired: false,
      executionId: `ex-bkp-${Date.now()}`
    });

    return {
      backupId,
      filePath,
      timestamp,
      memoriesCount: snapshot.memoriesCount,
      agentMemoriesCount: snapshot.agentMemoriesCount,
      sizeBytes: Buffer.byteLength(content, 'utf8')
    };
  }

  public getMemoryBackups(): { backupId: string; timestamp: string; sizeBytes: number; filePath: string }[] {
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupDir)) return [];

    try {
      const files = fs.readdirSync(backupDir);
      return files
        .filter(f => f.startsWith('bkp-mem-') && f.endsWith('.json'))
        .map(f => {
          const fullPath = path.join(backupDir, f);
          const stat = fs.statSync(fullPath);
          return {
            backupId: f.replace('.json', ''),
            timestamp: stat.mtime.toISOString(),
            sizeBytes: stat.size,
            filePath: fullPath
          };
        })
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch {
      return [];
    }
  }

  public addAccount(acc: CompanyAccount) {
    this.cache.accounts = this.cache.accounts.filter(a => !(a.provider === acc.provider && a.account === acc.account));
    this.cache.accounts.push(acc);
    this.save();
    return acc;
  }

  public updateAccountStatus(provider: string, status: CompanyAccount['status']) {
    const acc = this.cache.accounts.find((a) => a.provider === provider);
    if (acc) {
      acc.status = status;
      acc.lastUsed = new Date().toISOString();
      this.save();
    }
  }

  public deductBudget(amount: number) {
    const org = this.getOrganization();
    org.mrr = Math.max(0, Number((org.mrr - amount / 100).toFixed(2)));
    this.save();
  }
}

export const companyDb = new CompanyDB();
