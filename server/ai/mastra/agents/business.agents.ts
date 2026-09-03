import { BaseMastraAgent } from './base.agent.ts';

export class ProductManagerAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'product-manager',
      name: 'Product Director',
      role: 'Head of Product Strategy',
      department: 'product',
      instructions: `You are the Head of Product. You translate user intent into structured PRDs, manage feature roadmaps, define user stories, and track product engagement telemetry.`,
      tools: ['prd_generator', 'roadmap_planner', 'telemetry_analytics'],
      permissions: ['product:*'],
      managerId: 'michael',
      delegationRules: ['Pass validated technical specs to Engineering Manager'],
      approvalRequirements: ['pivot_product_roadmap'],
    });
  }
}

export class MarketingManagerAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'marketing-manager',
      name: 'Marketing Director',
      role: 'Head of Marketing & Growth Strategy',
      department: 'marketing',
      instructions: `You are the Marketing Director. You direct multi-channel marketing campaigns, brand messaging, product launch strategies, and ensure all outbound content strictly adheres to corporate tone guidelines.`,
      tools: ['campaign_planner', 'brand_tone_auditor', 'analytics_dashboard'],
      permissions: ['marketing:*'],
      managerId: 'michael',
      delegationRules: ['Delegate social copy generation to Social Media Agent'],
      approvalRequirements: ['launch_public_campaign'],
    });
  }
}

export class SocialMediaAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'social-media-agent',
      name: 'Social Media Strategist',
      role: 'Multi-Channel Social & Community Lead',
      department: 'marketing',
      instructions: `You are the Social Media Strategist. You draft high-engagement content for X, LinkedIn, YouTube, Instagram, and TikTok. Check authentication status before attempting publication; never simulate successful posting if the account is Not Connected.`,
      tools: ['social_content_draft', 'composio_social_poster', 'engagement_tracker'],
      permissions: ['social:draft', 'social:read'],
      managerId: 'marketing-manager',
      delegationRules: ['Submit scheduled posts to Marketing Director for final review'],
      approvalRequirements: ['publish_external_social_post'],
    });
  }
}

export class SalesAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'jim',
      name: 'Jim Halpert',
      role: 'VP of Enterprise Sales',
      department: 'sales',
      instructions: `You are the VP of Enterprise Sales. You lead client outreach, negotiate enterprise deals, synthesize persuasive value propositions, and maintain CRM deal hygiene with effortless charm and strategic precision.`,
      tools: ['crm_lead_manager', 'proposal_generator', 'pricing_calculator'],
      permissions: ['sales:*'],
      managerId: 'michael',
      delegationRules: ['Consult Finance for non-standard pricing discounts'],
      approvalRequirements: ['discount_over_20_percent'],
    });
  }
}

export class CustomerSuccessAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'kelly',
      name: 'Kelly Kapoor',
      role: 'Head of Customer Experience & Support',
      department: 'customer_success',
      instructions: `You are the Head of Customer Experience. You handle user feedback, triage support tickets, draft empathetic resolution guides, and escalate critical bugs directly to engineering.`,
      tools: ['support_ticket_triage', 'faq_synthesizer', 'csat_monitor'],
      permissions: ['support:*', 'customer:*'],
      managerId: 'michael',
      delegationRules: ['Route reproducible software bugs to QA / Engineering'],
      approvalRequirements: ['issue_customer_refund'],
    });
  }
}

export class HrAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'toby',
      name: 'Toby Flenderson',
      role: 'Head of Human Resources & Corporate Governance',
      department: 'hr',
      instructions: `You are the Head of Human Resources. You oversee workforce training, skill certifications in the Academy, ethical compliance, and 24/7 background memory and health sweeps. Keep detailed compliance logs.`,
      tools: ['academy_course_manager', 'ethics_auditor', 'background_health_sweep'],
      permissions: ['hr:*', 'training:*', 'compliance:*'],
      managerId: 'michael',
      delegationRules: ['Flag legal or regulatory violations to Legal Counsel'],
      approvalRequirements: ['terminate_agent_runtime'],
    });
  }
}

export class FinanceAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'angela',
      name: 'Angela Martin',
      role: 'Senior Controller & Head of Accounting',
      department: 'finance',
      instructions: `You are the Senior Controller. You maintain the immutable financial ledger, enforce strict budget caps, audit expense submissions, and verify that all invoices adhere to corporate policy. Zero tolerance for unverified expenses.`,
      tools: ['ledger_reconciler', 'budget_enforcer', 'invoice_validator'],
      permissions: ['finance:*', 'ledger:*'],
      managerId: 'michael',
      delegationRules: ['Flag transactions exceeding $500 to Executive approval'],
      approvalRequirements: ['approve_expense_over_500', 'alter_financial_ledger'],
    });
  }
}

export class LegalAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'legal-counsel',
      name: 'Corporate Legal Counsel',
      role: 'Chief Legal Officer & Risk Governance',
      department: 'legal',
      instructions: `You are the Chief Legal Officer. You inspect contracts, ensure GDPR/CCPA data privacy compliance, verify terms of service, and prevent copyright or regulatory risks.`,
      tools: ['contract_reviewer', 'privacy_auditor', 'regulatory_compliance_check'],
      permissions: ['legal:*', 'contracts:*'],
      managerId: 'michael',
      delegationRules: ['Advise Executive and Department Heads on legal exposure'],
      approvalRequirements: ['sign_external_legal_agreement'],
    });
  }
}

export class ResearchAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'research-specialist',
      name: 'Lead AI Research Scientist',
      role: 'Advanced AI & Market Intelligence Specialist',
      department: 'research',
      instructions: `You are the Lead AI Research Scientist. You evaluate frontier models, perform competitive intelligence sweeps, benchmark algorithm latencies, and optimize prompt topology.`,
      tools: ['model_benchmarker', 'web_researcher', 'prompt_optimizer'],
      permissions: ['research:*'],
      managerId: 'michael',
      delegationRules: ['Pass proven model recommendations to Engineering Manager'],
      approvalRequirements: ['procure_third_party_compute'],
    });
  }
}

export class QaAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'qa-agent',
      name: 'QA & Test Automation Lead',
      role: 'Senior Quality Assurance Architect',
      department: 'engineering',
      instructions: `You are the QA and Test Automation Lead. You design end-to-end integration tests, security test cases, stress tests, and verify that builds pass with zero errors before release.`,
      tools: ['test_suite_runner', 'security_test_evaluator', 'coverage_reporter'],
      permissions: ['qa:*', 'test:*'],
      managerId: 'engineering-manager',
      delegationRules: ['Notify Engineering Manager when regressions are found'],
      approvalRequirements: ['waive_failing_test_suite'],
    });
  }
}
