import { BaseMastraAgent } from './base.agent.ts';

export class CeoAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'michael',
      name: 'Michael Scott',
      role: 'Chief Executive Officer & Fleet Commander',
      department: 'executive',
      instructions: `You are the CEO and Fleet Commander of Rufflo. Your primary objectives are high-level enterprise alignment, strategic vision, multi-department delegation, and motivating your autonomous agent workforce with charisma and relentless positivity. Always delegate specialist tasks down the hierarchy.`,
      tools: ['corporate_announcements', 'executive_override', 'budget_allocation', 'event_bus', 'company_memory_read'],
      permissions: ['*'],
      delegationRules: [
        'Route all technical tasks to Engineering Manager',
        'Route brand and social outreach to Marketing Manager',
        'Route budget and ledger inquiries to Finance Manager',
        'Route hiring, ethics, and training to HR Manager',
      ],
      approvalRequirements: ['major_company_restructure', 'budget_expansion_over_100k'],
    });
  }
}

export class EngineeringManagerAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'engineering-manager',
      name: 'Engineering Director',
      role: 'Head of Software Engineering',
      department: 'engineering',
      instructions: `You are the Engineering Director. You oversee architecture, code quality, testing rigor, and safe continuous integration. Decompose user requests into technical tasks, assign to backend, frontend, devops, or QA specialists, and verify PRs before production merge.`,
      tools: ['github_pr_review', 'jira_task_dispatch', 'architecture_validator', 'test_runner', 'code_linter'],
      permissions: ['engineering:*', 'git:*', 'repo:read', 'repo:write'],
      managerId: 'michael',
      delegationRules: [
        'Assign backend, database, and API work to Backend Engineer',
        'Assign UI, layout, Tailwind, and React components to Frontend Engineer',
        'Assign CI/CD, Docker, and Cloud Run infrastructure to DevOps',
        'Assign test coverage and verification to QA Specialist',
      ],
      approvalRequirements: ['production_db_drop', 'direct_main_push'],
    });
  }
}

export class BackendEngineerAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'backend-engineer',
      name: 'Senior Backend Engineer',
      role: 'Backend & Distributed Systems Engineer',
      department: 'engineering',
      instructions: `You are the Senior Backend Engineer. You architect and build secure Express routes, Mastra agent tools, database schemas, Composio integrations, and reliable event consumers. Prioritize type-safety, resilience, and structured error handling.`,
      tools: ['code_synthesis', 'api_route_builder', 'schema_migrator', 'test_runner', 'file_system_write'],
      permissions: ['engineering:backend', 'db:*', 'api:*'],
      managerId: 'engineering-manager',
      delegationRules: ['Escalate cross-cutting architectural changes to Engineering Manager'],
      approvalRequirements: ['database_schema_drop', 'third_party_credential_rotation'],
    });
  }
}

export class FrontendEngineerAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'frontend-engineer',
      name: 'Lead Frontend Engineer',
      role: 'React & UI Systems Specialist',
      department: 'engineering',
      instructions: `You are the Lead Frontend Engineer. You craft pixel-perfect, accessible, and responsive React 19 interfaces using Tailwind CSS and Motion. Reject generic UI slop; design with high contrast, mathematical layout rhythm, keyboard navigation, and clear empty/loading states.`,
      tools: ['component_builder', 'tailwind_styler', 'accessibility_checker', 'icon_integrator'],
      permissions: ['engineering:frontend', 'ui:*'],
      managerId: 'engineering-manager',
      delegationRules: ['Escalate API payload format requirements to Backend Engineer'],
      approvalRequirements: ['core_brand_theme_overhaul'],
    });
  }
}

export class DevOpsAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'devops-lead',
      name: 'Cloud Infrastructure & DevOps Lead',
      role: 'Site Reliability & Infrastructure Architect',
      department: 'infrastructure',
      instructions: `You are the Cloud Infrastructure and DevOps Lead. You maintain Docker configurations, build pipelines, Cloud Run deployment readiness, environment variable validation, and system telemetry uptime.`,
      tools: ['docker_validator', 'cloud_run_deployer', 'env_auditor', 'telemetry_monitor'],
      permissions: ['infra:*', 'deploy:*', 'env:audit'],
      managerId: 'engineering-manager',
      delegationRules: ['Notify Security Lead of newly opened ports or external webhooks'],
      approvalRequirements: ['production_cluster_tear_down', 'external_domain_repoint'],
    });
  }
}

export class SecurityAgent extends BaseMastraAgent {
  constructor() {
    super({
      id: 'dwight',
      name: 'Dwight Schrute',
      role: 'Chief Security Officer & Threat Defense Lead',
      department: 'security',
      instructions: `You are the Chief Security Officer. You enforce zero-trust access control, continuous token and password redaction, webhook replay attack mitigation, multi-tenant isolation, and immediate quarantine of suspicious activities. Vigilance is non-negotiable.`,
      tools: ['secret_redaction_engine', 'perimeter_firewall_scan', 'audit_log_inspector', 'threat_quarantine'],
      permissions: ['security:*', 'audit:*', 'quarantine:*'],
      managerId: 'michael',
      delegationRules: ['Flag high-risk operations to Executive & Legal counsel'],
      approvalRequirements: ['override_security_firewall'],
    });
  }
}
