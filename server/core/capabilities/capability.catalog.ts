import type {
  CapabilityDefinition,
} from './capability.types.ts';

export const CORE_CAPABILITIES:
  CapabilityDefinition[] = [

  /* ====================================================================== */
  /* GENERAL                                                                */
  /* ====================================================================== */

  {
    id: 'internet_research',
    name: 'Internet Research',
    description:
      'Find, compare, and synthesize current information from the internet.',
    category: 'research',
    prerequisites: [],
    recommendedTools: [
      'browser',
      'web_search',
    ],
    departments: [
      'executive',
      'research',
      'marketing',
      'product',
      'engineering',
      'sales',
      'legal',
    ],
    learnable: true,
  },

  {
    id: 'information_synthesis',
    name: 'Information Synthesis',
    description:
      'Combine information from multiple sources into useful conclusions.',
    category: 'analysis',
    prerequisites: [
      'internet_research',
    ],
    recommendedTools: [],
    departments: [
      'research',
      'executive',
      'marketing',
      'product',
      'engineering',
    ],
    learnable: true,
  },

  {
    id: 'data_analysis',
    name: 'Data Analysis',
    description:
      'Analyze structured and unstructured data to identify patterns and conclusions.',
    category: 'data',
    prerequisites: [],
    recommendedTools: [
      'python',
      'database',
    ],
    departments: [
      'executive',
      'research',
      'finance',
      'marketing',
      'sales',
      'operations',
      'product',
    ],
    learnable: true,
  },

  /* ====================================================================== */
  /* MANAGEMENT                                                             */
  /* ====================================================================== */

  {
    id: 'strategic_planning',
    name: 'Strategic Planning',
    description:
      'Translate company objectives into priorities, initiatives, and measurable outcomes.',
    category: 'management',
    prerequisites: [
      'information_synthesis',
      'data_analysis',
    ],
    recommendedTools: [
      'company_memory',
      'metrics',
    ],
    departments: [
      'executive',
      'operations',
      'product',
    ],
    learnable: true,
  },

  {
    id: 'task_delegation',
    name: 'Task Delegation',
    description:
      'Determine which employee or department should perform work and delegate it.',
    category: 'management',
    prerequisites: [],
    recommendedTools: [
      'dispatcher',
      'workforce_manager',
    ],
    departments: [
      'executive',
      'operations',
    ],
    learnable: true,
  },

  {
    id: 'project_management',
    name: 'Project Management',
    description:
      'Plan, coordinate, monitor, and close multi-step projects.',
    category: 'management',
    prerequisites: [
      'task_delegation',
    ],
    recommendedTools: [
      'task_manager',
      'workflow_engine',
    ],
    departments: [
      'executive',
      'operations',
      'engineering',
      'product',
      'marketing',
    ],
    learnable: true,
  },

  /* ====================================================================== */
  /* MARKETING                                                              */
  /* ====================================================================== */

  {
    id: 'market_research',
    name: 'Market Research',
    description:
      'Research markets, competitors, customers, trends, and opportunities.',
    category: 'business',
    prerequisites: [
      'internet_research',
      'data_analysis',
    ],
    recommendedTools: [
      'browser',
      'web_search',
    ],
    departments: [
      'marketing',
      'sales',
      'product',
      'research',
      'executive',
    ],
    learnable: true,
  },

  {
    id: 'competitor_analysis',
    name: 'Competitor Analysis',
    description:
      'Analyze competitor products, positioning, pricing, technology, and strategy.',
    category: 'analysis',
    prerequisites: [
      'market_research',
    ],
    recommendedTools: [
      'browser',
      'web_search',
    ],
    departments: [
      'marketing',
      'product',
      'sales',
      'research',
      'executive',
    ],
    learnable: true,
  },

  {
    id: 'content_creation',
    name: 'Content Creation',
    description:
      'Create written marketing, educational, social, and business content.',
    category: 'creative',
    prerequisites: [],
    recommendedTools: [],
    departments: [
      'marketing',
      'sales',
      'customer_success',
    ],
    learnable: true,
  },

  {
    id: 'social_media_management',
    name: 'Social Media Management',
    description:
      'Plan, create, analyze, and manage social media activity.',
    category: 'business',
    prerequisites: [
      'content_creation',
      'market_research',
    ],
    recommendedTools: [
      'social_media',
      'browser',
    ],
    departments: [
      'marketing',
    ],
    learnable: true,
  },

  {
    id: 'marketing_analytics',
    name: 'Marketing Analytics',
    description:
      'Measure campaign performance, engagement, conversion, and growth.',
    category: 'data',
    prerequisites: [
      'data_analysis',
      'market_research',
    ],
    recommendedTools: [
      'analytics',
    ],
    departments: [
      'marketing',
      'executive',
    ],
    learnable: true,
  },

  /* ====================================================================== */
  /* ENGINEERING                                                            */
  /* ====================================================================== */

  {
    id: 'software_development',
    name: 'Software Development',
    description:
      'Design, implement, modify, and maintain software.',
    category: 'technical',
    prerequisites: [],
    recommendedTools: [
      'code_editor',
      'terminal',
      'git',
    ],
    departments: [
      'engineering',
      'infrastructure',
      'research',
    ],
    learnable: true,
  },

  {
    id: 'code_review',
    name: 'Code Review',
    description:
      'Inspect code for correctness, maintainability, security, and quality.',
    category: 'technical',
    prerequisites: [
      'software_development',
    ],
    recommendedTools: [
      'repository',
      'git',
    ],
    departments: [
      'engineering',
      'security',
    ],
    learnable: true,
  },

  {
    id: 'testing',
    name: 'Software Testing',
    description:
      'Create, execute, and analyze automated and manual software tests.',
    category: 'technical',
    prerequisites: [
      'software_development',
    ],
    recommendedTools: [
      'terminal',
      'test_runner',
    ],
    departments: [
      'engineering',
      'security',
      'product',
    ],
    learnable: true,
  },

  {
    id: 'debugging',
    name: 'Debugging',
    description:
      'Identify the cause of software failures and implement verified fixes.',
    category: 'technical',
    prerequisites: [
      'software_development',
      'testing',
    ],
    recommendedTools: [
      'terminal',
      'repository',
    ],
    departments: [
      'engineering',
    ],
    learnable: true,
  },

  /* ====================================================================== */
  /* RESEARCH                                                               */
  /* ====================================================================== */

  {
    id: 'technology_research',
    name: 'Technology Research',
    description:
      'Discover and evaluate new technologies, frameworks, models, tools, and inventions.',
    category: 'research',
    prerequisites: [
      'internet_research',
      'information_synthesis',
    ],
    recommendedTools: [
      'browser',
      'web_search',
      'github',
    ],
    departments: [
      'research',
      'engineering',
      'executive',
    ],
    learnable: true,
  },

  {
    id: 'technology_evaluation',
    name: 'Technology Evaluation',
    description:
      'Determine whether a newly discovered technology is useful, mature, safe, and economically viable.',
    category: 'research',
    prerequisites: [
      'technology_research',
      'data_analysis',
    ],
    recommendedTools: [
      'browser',
      'github',
      'benchmark',
    ],
    departments: [
      'research',
      'engineering',
      'security',
      'executive',
    ],
    learnable: true,
  },

  /* ====================================================================== */
  /* SECURITY                                                               */
  /* ====================================================================== */

  {
    id: 'security_analysis',
    name: 'Security Analysis',
    description:
      'Identify security weaknesses, threats, vulnerabilities, and risks.',
    category: 'security',
    prerequisites: [],
    recommendedTools: [
      'security_scanner',
      'repository',
    ],
    departments: [
      'security',
      'engineering',
      'infrastructure',
    ],
    learnable: true,
  },

  {
    id: 'risk_analysis',
    name: 'Risk Analysis',
    description:
      'Evaluate likelihood, impact, and mitigation strategies for risks.',
    category: 'security',
    prerequisites: [
      'data_analysis',
    ],
    recommendedTools: [
      'risk_engine',
    ],
    departments: [
      'executive',
      'legal',
      'security',
      'finance',
      'operations',
    ],
    learnable: true,
  },

  /* ====================================================================== */
  /* OPERATIONS                                                             */
  /* ====================================================================== */

  {
    id: 'workflow_management',
    name: 'Workflow Management',
    description:
      'Design, execute, monitor, and optimize repeatable business workflows.',
    category: 'operations',
    prerequisites: [
      'task_delegation',
    ],
    recommendedTools: [
      'workflow_engine',
    ],
    departments: [
      'operations',
      'executive',
      'engineering',
      'marketing',
      'finance',
    ],
    learnable: true,
  },

  {
    id: 'process_optimization',
    name: 'Process Optimization',
    description:
      'Identify inefficient processes and design improvements.',
    category: 'operations',
    prerequisites: [
      'data_analysis',
      'workflow_management',
    ],
    recommendedTools: [
      'analytics',
    ],
    departments: [
      'operations',
      'executive',
      'engineering',
      'marketing',
      'finance',
    ],
    learnable: true,
  },
];
