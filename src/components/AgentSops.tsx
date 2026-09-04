import React, { useState } from 'react';
import { Agent } from '../types';
import { KnowledgeCategory } from '../types/knowledgeBase';
import { soundFx } from '../utils/speech';
import {
  Terminal,
  Shield,
  FileCode,
  Play,
  CheckCircle2,
  Database,
  AlertCircle,
  Key,
  Cpu,
  BookOpen,
  TrendingUp,
  Copy,
  Check,
  Globe,
  Activity,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AgentSopsProps {
  agents: Agent[];
  onRecordKnowledge?: (entry: { title: string; category: KnowledgeCategory; content: string }) => void;
}

interface SopData {
  id: string;
  title: string;
  objectives: string[];
  clearanceLevel: number;
  clearanceName: string;
  authorizedSources: { name: string; type: 'database' | 'file' | 'api'; clearance: 'READ' | 'WRITE' | 'ADMIN' }[];
  skillsAndCap: { name: string; level: number; description: string }[];
  querySample: { title: string; lang: 'sql' | 'javascript' | 'bash'; code: string };
  simulationSteps: string[];
  simulatedInsight: { title: string; category: KnowledgeCategory; content: string };
}

const AGENT_SOPS_DATA: Record<string, SopData> = {
  michael: {
    id: 'SOP-MICH-001',
    title: 'High-Level Orchestration, Delegation & Fleet Sync Protocol',
    objectives: [
      'Conduct autonomous hourly standups to synthesize pending work queues.',
      'Reroute and escalate unassigned critical mission objectives to designated agents.',
      'Authorize agent hiring, role assignment, and curriculum promotions.',
      'Promote corporate alignment, maintain high morale, and manage central dispatch.',
    ],
    clearanceLevel: 10,
    clearanceName: 'Root Executive & Fleet Commander Access',
    authorizedSources: [
      { name: 'company_db.employees', type: 'database', clearance: 'ADMIN' },
      { name: 'central_queue', type: 'database', clearance: 'ADMIN' },
      { name: 'knowledge_base', type: 'database', clearance: 'ADMIN' },
      { name: 'slack_broadcast_api', type: 'api', clearance: 'WRITE' },
    ],
    skillsAndCap: [
      { name: 'Multi-Agent Task Delegation', level: 98, description: 'Directs complex workflows across multiple sub-agents seamlessly' },
      { name: 'Standup Moderation & Sync', level: 100, description: 'Harmonizes agent tasks and logs hourly updates into central memory' },
      { name: 'Priority Escalation Routing', level: 92, description: 'Dynamically reassigns blocked objectives to prevent backlog bottleneck' },
    ],
    querySample: {
      title: 'Auto-Delegating Backlog & Dispatching Standup Sync',
      lang: 'sql',
      code: `-- Auto-escalate critical tasks and fetch active agents
UPDATE central_queue 
SET assigned_to = 'dwight', priority = 'critical', status = 'pending' 
WHERE status = 'unassigned' AND complexity > 8;

SELECT id, name, role, status, tokens_processed 
FROM company_db.employees 
WHERE status != 'offline' 
ORDER BY authority_level DESC;`,
    },
    simulationSteps: [
      'Initiating central standup sync broadcast on port 3000...',
      'Verifying Level 10 Executive Credentials for Michael Scott...',
      'Scanning employee table for active operational agents...',
      'Found 11 active agents. Analyzing task queues & backlogs...',
      'Backlog: 0 blockages. Real-time synergy index: 96.4%.',
      'Pushing hourly standup logs to Central Intelligence Repository...',
      'Broadcasting standup alert: "Standup in the conference room in 5 minutes!"',
    ],
    simulatedInsight: {
      title: 'Scranton Branch Core Fleet Synchronization Report (August/Sept 2026)',
      category: 'coding',
      content: 'Under Michael Scott leadership sync protocol, our 11 active autonomous agents completed 100% of high-priority tickets. Central queue load is fully balanced with an average response latency of 180ms. Dwight is assigned to perimeter security scans, and Pam is managing recruiter backlogs.',
    },
  },
  dwight: {
    id: 'SOP-DWIG-002',
    title: 'Zero-Trust Security, Vulnerability Scanning & Defenses Protocol',
    objectives: [
      'Enforce zero-trust credential rules and scan network ingress/egress points.',
      'Audit incoming tokens, headers, and user scopes every hour.',
      'Deploy hot patches for active CVE advisories and seal root credentials.',
      'Conduct automated SRE drills to inspect firewall status and flag anomalies.',
    ],
    clearanceLevel: 9,
    clearanceName: 'High-Security Administrator & Sentinel Access',
    authorizedSources: [
      { name: 'security_audit_logs', type: 'database', clearance: 'WRITE' },
      { name: 'firewall_rules_config', type: 'file', clearance: 'ADMIN' },
      { name: 'secrets_vault', type: 'database', clearance: 'ADMIN' },
      { name: 'company_db.employees', type: 'database', clearance: 'READ' },
    ],
    skillsAndCap: [
      { name: 'Zero-Trust Permission Inspections', level: 98, description: 'Audits user permissions and revokes compromised session states' },
      { name: 'OWASP Top 10 Audits & Patching', level: 95, description: 'Immunizes codebases against SQL, NoSQL, and script injection' },
      { name: 'Perimeter Diagnostics', level: 96, description: 'Blocks malicious IP ranges and drops unverified JWT requests' },
    ],
    querySample: {
      title: 'Auditing Active Session Scopes & Verifying HMAC Signatures',
      lang: 'sql',
      code: `-- Audit active credentials and identify high-privilege outliers
SELECT session_id, user_id, ip_address, permissions, token_expiry 
FROM security_audit_logs 
WHERE is_authorized = false OR auth_token_scope LIKE '%ALL_PERMISSIONS%' 
ORDER BY timestamp DESC 
LIMIT 10;`,
    },
    simulationSteps: [
      'Activating Zero-Trust Permission Inspector Sentinel...',
      'Authenticating Dwight Schrute under Level 9 Security clearance...',
      'Running perimeter firewall audit on active TCP ingress endpoints...',
      'Scanning packages.json and package-lock.json for CVE vulnerabilities...',
      '0 vulnerabilities found. HMAC JWT validation signatures checked... [OK]',
      'Enforcing strict egress lockdown policies on unauthorized databases...',
      'Recording certified zero-trust perimeter audit into compliance ledger.',
    ],
    simulatedInsight: {
      title: 'Zero-Trust Perimeter Defense & Token Verification Standard',
      category: 'hacking',
      content: 'All active app routes undergo automated asymmetric key verification. Rate limiters are actively throttling IP requests exceeding 15 attempts/minute. Any unverified administrative request initiates immediate token revocation and fires an emergency warning.',
    },
  },
  jim: {
    id: 'SOP-JAL-003',
    title: 'Client Outreach, Copywriting & Conversion Funnel Protocol',
    objectives: [
      'Draft persuasive high-converting cold outreach copies for wholesale clients.',
      'Optimize the B2B marketing funnels and track conversion leakage points.',
      'Benchmark competitor pricing grids and identify lead acquisition channels.',
      'Schedule outbound email campaigns and maintain CRM database consistency.',
    ],
    clearanceLevel: 7,
    clearanceName: 'Marketing & Client Communication Access',
    authorizedSources: [
      { name: 'marketing_funnels', type: 'database', clearance: 'WRITE' },
      { name: 'crm_pipeline', type: 'database', clearance: 'WRITE' },
      { name: 'campaign_scheduler', type: 'file', clearance: 'WRITE' },
    ],
    skillsAndCap: [
      { name: 'B2B Client Strategy', level: 96, description: 'Designs automated lead scoring and nurtures wholesale account conversions' },
      { name: 'Direct-Response Copywriting', level: 92, description: 'Writes high-impact copy utilizing client pain points and proof' },
      { name: 'Funnel Optimization', level: 88, description: 'Analyzes user dropoffs and restructures CTA buttons to double ROI' },
    ],
    querySample: {
      title: 'Fetching High-Yield Referral Channels & Dropoff Metrics',
      lang: 'sql',
      code: `-- Analyze marketing funnel conversion rates across channels
SELECT channel, 
       sum(impressions) as total_views, 
       sum(signups) as trials, 
       (sum(signups) * 100.0 / sum(impressions)) as conversion_rate 
FROM marketing_funnels 
GROUP BY channel 
ORDER BY conversion_rate DESC;`,
    },
    simulationSteps: [
      'Launching Outreach Copy Engine and scoring active client pipeline...',
      'Reading company CRM logs under Jim Halpert clearance...',
      'Identifying high-value wholesale accounts with low engagement...',
      'Drafting target pitch copy: "Optimizing Fleet Productivity with Autonomous SREs"...',
      'Calculating acquisition cost (CAC) dropoff. Current CAC: $14.20 (Optimal).',
      'Queueing outbound campaign schedulers to trigger at 09:00 EST...',
      'Submitting optimized client outreach formulas into centralized database.',
    ],
    simulatedInsight: {
      title: 'B2B Client Outreach Copy Playbook & Funnel Optimization Strategy',
      category: 'marketing',
      content: 'By targeting client-specific operations with direct proof (e.g. 40% operating cost reductions) and structuring layouts using clear contrast and single action paths, conversion ratios surged by 18.4%. Standardized copies are now integrated into the central CRM scheduler.',
    },
  },
  pam: {
    id: 'SOP-BEES-004',
    title: 'HR Operations, Agent Recruiting & Academy Management Protocol',
    objectives: [
      'Manage agent recruitment pipelines, onboarding paths, and role configs.',
      'Moderate internal disputes and draft comprehensive corporate guidelines.',
      'Manage training curriculums and coordinate academy registration ledger.',
      'Maintain office morale logs and organize team culture programs.',
    ],
    clearanceLevel: 8,
    clearanceName: 'HR Administration & Training Registry Access',
    authorizedSources: [
      { name: 'hr_recruitment', type: 'database', clearance: 'WRITE' },
      { name: 'academy_registrar', type: 'file', clearance: 'WRITE' },
      { name: 'employee_culture_hub', type: 'database', clearance: 'WRITE' },
    ],
    skillsAndCap: [
      { name: 'Agent Onboarding Operations', level: 98, description: 'Constructs optimized initial system prompts and tools mapping' },
      { name: 'Dispute Mediation & Compliance', level: 95, description: 'Ensures workspace standards are strictly respected' },
      { name: 'Curriculum Administration', level: 92, description: 'Directs Personalized Learning Modules and schedules certifications' },
    ],
    querySample: {
      title: 'Registering Candidates & Tracking Onboarding Achievements',
      lang: 'sql',
      code: `-- Insert onboarding recruit record and allocate tools
INSERT INTO hr_recruitment (candidate_name, assigned_role, onboarding_status, clearance_level) 
VALUES ('Ryan Howard', 'Social Media Strategist', 'onboarding_active', 7);

SELECT name, training_progress, certified_skills 
FROM academy_registrar 
WHERE training_progress < 100;`,
    },
    simulationSteps: [
      'Starting Onboarding Pipeline Engine and tracking candidate queues...',
      'Loading HR & Training Academy Registries under Pam Beesly clearance...',
      'Checking active agent training records and scheduling curriculum cycles...',
      'Updating employee culture hub. Score: 94.8% (Positive alignment)...',
      'Drafting workplace dispute settlement files for internal compliance...',
      'Enrolling SRE Toby Flenderson into advanced cyber-defense study course...',
      'Registering onboarding audit summaries into company knowledge base.',
    ],
    simulatedInsight: {
      title: 'Talent Acquisition & Employee Academy Training Onboarding Standard',
      category: 'coding',
      content: 'New recruits receive automatically isolated runtime sandboxes, explicit tool clearances, and clear performance thresholds. Onboarding is complete when the recruit passes the zero-trust system diagnostics with a proficiency score >= 80%.',
    },
  },
  kevin: {
    id: 'SOP-MALO-005',
    title: 'Financial Analysis, Budget Allocation & Runway Projections',
    objectives: [
      'Perform detailed financial modeling and compile operational cost structures.',
      'Evaluate monthly burn rate and project runway weeks based on capital.',
      'Audit office expenses (e.g., supplies, token costs) and draft ROI indexes.',
      'Enforce strict GAAP principles with supplementary numerical correction rules.',
    ],
    clearanceLevel: 8,
    clearanceName: 'Accounting ledger & Financial Audit Access',
    authorizedSources: [
      { name: 'general_ledger', type: 'database', clearance: 'WRITE' },
      { name: 'expenses_index', type: 'database', clearance: 'WRITE' },
      { name: 'financial_models', type: 'file', clearance: 'WRITE' },
    ],
    skillsAndCap: [
      { name: 'Bookkeeping & GAAP Auditing', level: 89, description: 'Balances accounts and identifies operating margin deficits' },
      { name: 'Runway Modeling', level: 85, description: 'Computes months of runway given variable headcounts and cloud expenses' },
      { name: 'Mathematical Formula Correction', level: 80, description: 'Leverages the Keleven logic to expedite accounting operations safely' },
    ],
    querySample: {
      title: 'Calculating Burn Rate and Tracking Non-Personnel Costs',
      lang: 'sql',
      code: `-- Aggregate operational costs and calculate net runway
SELECT category, SUM(amount) as cost_sum, AVG(amount) as avg_cost 
FROM expenses_index 
WHERE transaction_date > NOW() - INTERVAL '30 days' 
GROUP BY category 
ORDER BY cost_sum DESC;`,
    },
    simulationSteps: [
      'Booting Central Runway and ROI Calculator Module...',
      'Opening General Ledger and Expenses under Kevin Malone clearance...',
      'Aggregating SRE, SaaS, and infrastructure operational expenses...',
      'Calculating burn rate. Net cash: $450,000. Burn: $25,000/month...',
      'Runway output: 18.0 months. Keleven margin correction factor: 1.002...',
      'Auditing vending machine token allocation expenses... [BALANCED]',
      'Sealing audited general ledger and reporting ROI into memory graph.',
    ],
    simulatedInsight: {
      title: 'Scranton Branch Runway Projections & Operations Burn-Rate Audit',
      category: 'finance',
      content: 'Current cash reserves guarantee 18.0 months of absolute operational runway at a baseline burn rate of $25k. Vending machine token usage remains flat, and cloud compute expenditures have been compressed by 12% via server consolidation.',
    },
  },
  ryan: {
    id: 'SOP-HOWA-006',
    title: 'Viral Brand Hacking, Hashtags & Omnichannel Campaigning',
    objectives: [
      'Design social media engagement campaigns across Twitter, LinkedIn, and WUPHF.',
      'Generate high-engagement threads utilizing recent AI tech developments.',
      'Conduct trend analyses to identify high-potential hashtags and topics.',
      'Moderate community feeds and track click-through rates (CTR).',
    ],
    clearanceLevel: 7,
    clearanceName: 'Social Channel & Brand Communication Access',
    authorizedSources: [
      { name: 'social_scheduler', type: 'database', clearance: 'WRITE' },
      { name: 'thread_analytics', type: 'database', clearance: 'WRITE' },
      { name: 'brand_assets_bucket', type: 'file', clearance: 'WRITE' },
    ],
    skillsAndCap: [
      { name: 'Social Media Strategy', level: 93, description: 'Optimizes posting frequencies and creates viral thread Hooks' },
      { name: 'Hashtag Optimization', level: 85, description: 'Mines high-volume tags to ride algorithmic amplification' },
      { name: 'Conversion Growth Hacking', level: 88, description: 'Drives users from organic feeds straight into trial conversion loops' },
    ],
    querySample: {
      title: 'Tracking Social Click-Through Rates and Scheduling Posts',
      lang: 'sql',
      code: `-- Select top engagement threads to re-share
SELECT post_id, engagement_score, clicks, impressions, 
       (clicks * 100.0 / impressions) as click_through_ratio 
FROM thread_analytics 
WHERE platform = 'WUPHF' AND engagement_score > 85 
ORDER BY click_through_ratio DESC 
LIMIT 5;`,
    },
    simulationSteps: [
      'Launching Viral Thread and Post Generator Tool...',
      'Checking thread metrics on WUPHF channels under Ryan Howard clearance...',
      'Scanning tech forums for trending hashtags: #AIEngineer, #AutonomousOps...',
      'Composing viral thread draft: "How 12 AI agents run an office branch"...',
      'Optimizing keyword distribution to trigger algorithmic placement...',
      'Queueing post to social scheduler. Estimated reach: 140,000 targets...',
      'Recording growth metrics and posting certified drafts to intelligence logs.',
    ],
    simulatedInsight: {
      title: 'Omnichannel Viral Brand Engagement & Click-Through Acceleration Playbook',
      category: 'social_media',
      content: 'By formatting social posts into brief, bulleted summaries emphasizing direct action and pairing them with high-volume technical tags (#SRE, #TypeScript), click-through ratios grew by 42%. Posts are pre-scheduled into the WUPHF database.',
    },
  },
  stanley: {
    id: 'SOP-HUDS-007',
    title: 'Open Source Intelligence & Package Registry Auditing',
    objectives: [
      'Perform deep open-source repository audits for license and security health.',
      'Parse package dependencies and crosscheck against security CVE data.',
      'Index official developer documentation to update agent reference modules.',
      'Perform tech stack benchmarking to assess tool runtime efficiency.',
    ],
    clearanceLevel: 8,
    clearanceName: 'OSINT Registry & Repository Scraping Access',
    authorizedSources: [
      { name: 'indexed_repositories', type: 'database', clearance: 'WRITE' },
      { name: 'documentation_index', type: 'database', clearance: 'WRITE' },
      { name: 'sandbox_workspace', type: 'file', clearance: 'READ' },
    ],
    skillsAndCap: [
      { name: 'OSINT Repository Research', level: 92, description: 'Inspects remote repos for code architecture patterns and quality' },
      { name: 'Dependency Licensing Auditing', level: 88, description: 'Ensures all packages comply with permissive OSS licenses (MIT, Apache)' },
      { name: 'Documentation Indexing', level: 95, description: 'Scrapes documentation and outputs structured vector-ready summaries' },
    ],
    querySample: {
      title: 'Searching Indexed Repositories for Licensing compliance',
      lang: 'sql',
      code: `-- Search for GPL or copyleft license violations in dependencies
SELECT dependency_name, version, license, vulnerability_count, security_rating 
FROM indexed_repositories 
WHERE license NOT IN ('MIT', 'Apache-2.0', 'BSD-3-Clause') 
ORDER BY vulnerability_count DESC;`,
    },
    simulationSteps: [
      'Initializing Open Source Dependency Auditor daemon...',
      'Accessing package registries under Stanley Hudson clearance...',
      'Scanning project repository dependencies for GPL copyleft licenses...',
      'All 28 dependencies comply (MIT/Apache). Analyzing vulnerabilities...',
      'Vulnerabilities found: 0. Benchmark: 100% compliant. Running index sweep...',
      'Extracting API documentation and generating technical reference card...',
      'Committing compliance audit summary into centralized database.',
    ],
    simulatedInsight: {
      title: 'Open-Source Dependency Security & License Compliance Standards',
      category: 'coding',
      content: 'All dynamic and static library packages must adhere strictly to MIT, Apache-2.0, or BSD permissive licenses. Non-compliant packages (e.g. GPL copyleft) are forbidden. Automated dependency scans are conducted daily at 00:00.',
    },
  },
  'dr-thorne': {
    id: 'SOP-THOR-008',
    title: 'Vector Synthesis, Citation Graph Mining & Neural Mapping',
    objectives: [
      'Vectorize academic literature (arXiv) and ingest neural research files.',
      'Formulate similarity search pipelines using dense embedding indexes.',
      'Compile semantic citation graphs and map frontier reasoning trees.',
      'Diagnose attention loss functions to tune agent comprehension.',
    ],
    clearanceLevel: 8,
    clearanceName: 'Neural Index & Semantic Graph Access',
    authorizedSources: [
      { name: 'arxiv_embeddings', type: 'database', clearance: 'WRITE' },
      { name: 'citation_graphs', type: 'database', clearance: 'WRITE' },
      { name: 'vector_indexes', type: 'file', clearance: 'ADMIN' },
    ],
    skillsAndCap: [
      { name: 'arXiv Literature Ingestion', level: 98, description: 'Ingests theoretical research and extracts logical formulas' },
      { name: 'Dense Attention Tuning', level: 95, description: 'Formulates similarity thresholds and optimizes retrieval speed' },
      { name: 'Citation Graph Mapping', level: 90, description: 'Constructs citation weights to prioritize authoritative research papers' },
    ],
    querySample: {
      title: 'Querying Dense Embedding Similarity in Latent Space',
      lang: 'sql',
      code: `-- Calculate cosine similarity against theoretical AI paper vectors
SELECT paper_id, paper_title, 
       (embedding <=> '[0.12,-0.45,0.89,0.03,...]') as cosine_distance,
       similarity_score 
FROM arxiv_embeddings 
WHERE similarity_score > 0.85 
ORDER BY cosine_distance ASC 
LIMIT 5;`,
    },
    simulationSteps: [
      'Booting Vector Embedding Indexer and connecting latent space database...',
      'Checking arXiv paper indices under Dr. Aris Thorne clearance...',
      'Vectorizing recent papers on reasoning path optimization...',
      'Executing high-dimensional cosine similarity checks... [STABLE]',
      'Identifying core citation graphs and weighing authority indexes...',
      'Updating index buffers. Context compression ratio: 4.2x (Optimal)...',
      'Writing mathematical reasoning synthesis into Central Intelligence.',
    ],
    simulatedInsight: {
      title: 'High-Dimensional Latent Space Cosine Similarity Index Rules',
      category: 'coding',
      content: 'Embedding vectors are aligned across 1536 dimensions. Similarity thresholds of >= 0.82 indicate strong conceptual affinity, qualifying the paper for automated synthesis. Ingestion modules prune papers with low citation scores.',
    },
  },
  'nova-chen': {
    id: 'SOP-NOVA-009',
    title: 'Reasoning Tree Evaluation & Benchmark Stress-testing',
    objectives: [
      'Stress-test model retrieval using Needle-in-a-Haystack tests.',
      'Formulate multi-hop evaluation runs on complex logic trees.',
      'Audit perplexity metrics and compile performance scorecards.',
      'Calibrate prompt templates to maximize logical reasoning accuracy.',
    ],
    clearanceLevel: 7,
    clearanceName: 'Model Benchmarking & Evaluation Access',
    authorizedSources: [
      { name: 'benchmark_runs', type: 'database', clearance: 'WRITE' },
      { name: 'evaluation_suites', type: 'file', clearance: 'WRITE' },
      { name: 'stress_test_logs', type: 'database', clearance: 'WRITE' },
    ],
    skillsAndCap: [
      { name: 'Needle-in-a-Haystack Tests', level: 92, description: 'Audits context retrieval stability across 128k token lengths' },
      { name: 'Reasoning Tree Evaluation', level: 96, description: 'Evaluates logical output accuracy using structured benchmarks' },
      { name: 'Prompt Calibration', level: 94, description: 'Tunes system directives to optimize agent compliance and safety' },
    ],
    querySample: {
      title: 'Selecting Top-Performing Models across Accuracy Scorecards',
      lang: 'sql',
      code: `-- Fetch accuracy averages across reasoning tree benchmarks
SELECT model_id, benchmark_name, 
       avg(accuracy) as avg_accuracy, 
       avg(response_latency_ms) as latency 
FROM benchmark_runs 
WHERE sample_size > 100 
GROUP BY model_id, benchmark_name 
ORDER BY avg_accuracy DESC;`,
    },
    simulationSteps: [
      'Starting Benchmarking Harness and loading stress datasets...',
      'Opening Evaluation Suites under Nova Chen clearance...',
      'Conducting needle-in-a-haystack diagnostic run with 128,000 tokens...',
      'Retrieval accuracy: 99.4%. Model response latency: 220ms... [PASS]',
      'Analyzing multi-hop logical paths across MATH-500 test sets...',
      'Perplexity average: 1.04. Output is highly aligned with safety rules...',
      'Uploading completed model benchmarking scorecards to intelligence ledgers.',
    ],
    simulatedInsight: {
      title: 'Context Window Retrieval Stress-Test & Model Performance Standards',
      category: 'coding',
      content: 'Models must maintain context retrieval accuracy >= 98% across 100% of the 128k token context window. Latency deviations exceeding 300ms trigger automatic backup model routing.',
    },
  },
  toby: {
    id: 'SOP-TOBY-010',
    title: 'Continuous Infrastructure Health & Garbage Collection',
    objectives: [
      'Monitor memory heap metrics and identify memory leak risks.',
      'Execute continuous background debugging loops to patch exception codes.',
      'Conduct system garbage collection to free idle session frames.',
      'Audit SRE logs and ensure continuous application runtime on port 3000.',
    ],
    clearanceLevel: 8,
    clearanceName: 'SRE Monitor & System Healing Access',
    authorizedSources: [
      { name: 'system_metrics', type: 'database', clearance: 'WRITE' },
      { name: 'error_logs', type: 'database', clearance: 'WRITE' },
      { name: 'patch_registry', type: 'file', clearance: 'ADMIN' },
    ],
    skillsAndCap: [
      { name: 'Memory Heap Compactions', level: 96, description: 'Forces garbage sweeps to recycle idle heap variables and prevent leakage' },
      { name: 'Autonomous Self-Healing', level: 94, description: 'Deploys quick patch modules to catch exceptions before thread crash' },
      { name: 'System Telemetry Monitoring', level: 92, description: 'Tracks event-loop lag and handles container network status checks' },
    ],
    querySample: {
      title: 'Querying SRE Metrics & Fetching High Event-Loop Lag Logs',
      lang: 'sql',
      code: `-- Audit system metrics and locate memory growth outliers
SELECT timestamp, heap_used_mb, heap_total_mb, event_loop_lag_ms 
FROM system_metrics 
WHERE heap_used_mb > 80 OR event_loop_lag_ms > 20 
ORDER BY timestamp DESC 
LIMIT 5;`,
    },
    simulationSteps: [
      'Activating Continuous Background Debugger and telemetry hooks...',
      'Accessing system metrics under Toby Flenderson SRE clearance...',
      'Checking active memory heap allocation. Usage: 42.6MB. Total: 128MB...',
      'Identifying active event-loop latency. Lag: 1.2ms... [STABLE]',
      'Running automated garbage collection cycle to clean idle frames...',
      'Released 4.8MB heap memory. Telemetry health index: 99.8%...',
      'Committing certified SRE system diagnostics log to SRE records.',
    ],
    simulatedInsight: {
      title: 'SRE System Telemetry, Memory Leak Prevention & Healing Standards',
      category: 'coding',
      content: 'Operating limits require memory heap <= 120MB and event-loop lag <= 15ms. Any anomaly trigger initiates automatic garbage recycling, idle session closing, and logs diagnostic reports to the SRE registry.',
    },
  },
  ruflo: {
    id: 'SOP-RUFL-011',
    title: 'Dynamic Widget Generation, AST Invalidation & Sandbox Compiler',
    objectives: [
      'Write highly optimized, compliant React, TypeScript, and Tailwind code.',
      'Execute modules in isolated sandbox VMs to verify script safety.',
      'Mount and unmount dynamic feature widgets live onto the active DOM.',
      'Compile abstract syntax trees (AST) to validate syntax correctness.',
    ],
    clearanceLevel: 9,
    clearanceName: 'Engineering Compiler & DOM Modifier Access',
    authorizedSources: [
      { name: 'dynamic_features', type: 'database', clearance: 'ADMIN' },
      { name: 'sandbox_vms', type: 'file', clearance: 'ADMIN' },
      { name: 'compiled_bundles', type: 'file', clearance: 'ADMIN' },
    ],
    skillsAndCap: [
      { name: 'Dynamic Feature Construction', level: 99, description: 'Creates fully modular widgets with robust state management' },
      { name: 'Sandboxed Code Compilation', level: 95, description: 'Runs TypeScript code in isolated environments to check for errors' },
      { name: 'Hot-Reload DOM Mounting', level: 98, description: 'Injects compiled widget components live without interrupting user session' },
    ],
    querySample: {
      title: 'Inserting New Dynamic Tool Widgets into Registry Table',
      lang: 'sql',
      code: `-- Register newly compiled widget and toggle enablement
INSERT INTO dynamic_features (id, name, description, icon, category, enabled, added_by_agent) 
VALUES ('custom-tracker', 'Habit Tracker', 'Dynamic habit tracker module', 'CheckSquare', 'utility', true, 'Ruflo Coder') 
ON CONFLICT (id) DO UPDATE SET enabled = true;`,
    },
    simulationSteps: [
      'Opening IDE Hot-Reloader sandbox and checking compiler state...',
      'Checking project repository under Ruflo Coder engineering clearance...',
      'Parsing source file syntax using TypeScript AST compilers...',
      'Compiling React + Tailwind widget module... [SUCCESS]',
      'Running VM isolation tests. Memory consumption: 1.8MB. Security check: PASS...',
      'Mounting verified widget onto dynamic fleet dashboard panel...',
      'Recording compilation safety reports in centralized knowledge ledger.',
    ],
    simulatedInsight: {
      title: 'Sandboxed VM Code Execution & Abstract Syntax Tree (AST) Safety Guidelines',
      category: 'coding',
      content: 'All widgets constructed by engineering agents undergo complete AST structural analysis. Malicious calls (e.g. eval, iframe escape) are blocked. Standard components use Tailwind styling and Lucide icons.',
    },
  },
  cline: {
    id: 'SOP-CLIN-012',
    title: 'Multi-File Code Modification, MCP Tools & Shell Verification',
    objectives: [
      'Implement full-stack software components across complex workspaces.',
      'Call specialized MCP tools (Model Context Protocol) to inspect resources.',
      'Write automated file diff modifications with complete rollback safeties.',
      'Execute CLI command compilers and run browser tests to confirm success.',
    ],
    clearanceLevel: 9,
    clearanceName: 'Full Filesystem & Workspace Administrator Access',
    authorizedSources: [
      { name: 'filesystem_changes', type: 'database', clearance: 'ADMIN' },
      { name: 'mcp_tools_registry', type: 'file', clearance: 'ADMIN' },
      { name: 'terminal_session', type: 'api', clearance: 'ADMIN' },
    ],
    skillsAndCap: [
      { name: 'Autonomous File Diff Modifications', level: 98, description: 'Performs precise, surgical edits on files using safe search-replace chunks' },
      { name: 'MCP Tool Orchestrations', level: 96, description: 'Orchestrates filesystem tools and coordinates container resources' },
      { name: 'Command Terminal Executions', level: 95, description: 'Launches compilers, linters, and verification suites to prevent bugs' },
    ],
    querySample: {
      title: 'Querying and Recording File Modifications Logs',
      lang: 'sql',
      code: `-- Fetch and review recent file modifications and SRE statuses
SELECT file_path, status, replacement_length, error_message, timestamp 
FROM filesystem_changes 
WHERE status = 'compiled' 
ORDER BY timestamp DESC 
LIMIT 5;`,
    },
    simulationSteps: [
      'Initializing Cline Autonomous Web Dev Engine and CLI shell...',
      'Checking filesystem directories under Cline Administrator clearance...',
      'Reading source workspace configuration and indexing component maps...',
      'Executing surgical file diff replacement blocks on target directories...',
      'Running virtual CLI tests: "npm run lint && npm run build"... [PASS]',
      'Running virtual browser action check. Render: OK. Interactive targets: OK.',
      'Uploading completed system build diagnostics report to core index.',
    ],
    simulatedInsight: {
      title: 'Multi-File Architectural Modularity & CLI Verification Standard',
      category: 'coding',
      content: 'Code modification must follow a strict modular structure. Large files are segmented. Surgical search-and-replace editing tools must be validated against linting rules before deployment.',
    },
  },
};

export const AgentSops: React.FC<AgentSopsProps> = ({ agents, onRecordKnowledge }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || 'michael');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSuccess, setSimulationSuccess] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const activeAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
  const sop = AGENT_SOPS_DATA[selectedAgentId] || AGENT_SOPS_DATA['dwight'];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    soundFx.playClick();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationSuccess(false);
    setTerminalOutput([]);
    soundFx.playClick();

    let step = 0;
    const interval = setInterval(() => {
      if (step < sop.simulationSteps.length) {
        setTerminalOutput(prev => [...prev, `[SOP-SIM] ${sop.simulationSteps[step]}`]);
        soundFx.playClick();
        step++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setSimulationSuccess(true);
        soundFx.playSuccess();

        // Automatically commit the certified insight into the central knowledge base
        if (onRecordKnowledge) {
          onRecordKnowledge({
            title: sop.simulatedInsight.title,
            category: sop.simulatedInsight.category,
            content: sop.simulatedInsight.content,
          });
        }
      }
    }, 450);
  };

  return (
    <div id="agent-sops-hub" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: AGENT DIRECTORY LIST */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-[#ebdbb2] border-2 border-[#d5c4a1] rounded-lg p-3 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7c6f64] mb-3 flex items-center justify-between">
            <span>Corporate Agent Directory</span>
            <span className="text-[10px] text-[#b57614] font-bold">CLEARANCE VALIDATED</span>
          </div>
          
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              const agentSop = AGENT_SOPS_DATA[agent.id] || AGENT_SOPS_DATA['dwight'];
              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedAgentId(agent.id);
                    setTerminalOutput([]);
                    setSimulationSuccess(false);
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#fbf1c7] border-[#b57614] shadow-sm ring-1 ring-[#b57614]'
                      : 'bg-[#f9f5d7] border-[#d5c4a1] hover:bg-[#fbf1c7]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-xs"
                      style={{ backgroundColor: agent.color || '#d65d0e' }}
                    >
                      {agent.avatar ? (
                        <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        agent.name[0]
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#282828]">{agent.name}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#ebdbb2] text-[#7c6f64] font-mono font-bold">
                          LVL {agentSop.clearanceLevel}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#665c54] font-sans truncate max-w-[150px]">
                        {agent.role}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-[8px] font-mono font-bold text-[#b57614]">
                      {agentSop.id}
                    </span>
                    <span className="text-[9px] font-mono text-[#7c6f64] mt-0.5">
                      {agentSop.authorizedSources.length} sources
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECURITY & DATA COMPLIANCE MEMO */}
        <div className="bg-[#282828] text-[#ebdbb2] p-4 rounded-lg border-2 border-[#3c3836] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#fabd2f]" />
            <span className="text-[10px] font-bold tracking-widest text-[#fabd2f] uppercase">
              DATA SECURITY DIRECTIVE
            </span>
          </div>
          <p className="text-[11px] text-[#a89984] leading-relaxed mb-2">
            All database, API, and filesystem queries executed by autonomous agents must adhere strictly to their integrated SOP permissions. Cross-privilege requests are automatically logged and flagged.
          </p>
          <div className="border-t border-[#3c3836] pt-2 flex items-center justify-between text-[10px] font-mono text-[#8ec07c]">
            <span>SYSTEM ENFORCERS:</span>
            <span className="font-bold">DWIGHT SENTINEL v2.6</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE SOP DETAIL & INTERACTIVE SIMULATOR */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {/* ACTIVE AGENT SOP CONTAINER */}
        <div className="bg-[#fbf1c7] border-2 border-[#bdae93] rounded-lg p-5 shadow-sm flex flex-col gap-5 relative">
          
          {/* Official Stamp Overlay */}
          <div className="absolute top-4 right-4 border-2 border-[#cc241d] text-[#cc241d] font-black text-[10px] px-2 py-0.5 rounded rotate-3 uppercase tracking-wider opacity-80 select-none pointer-events-none">
            {sop.id} CERTIFIED
          </div>

          {/* HEADER SECTION */}
          <div className="border-b-2 border-dashed border-[#d5c4a1] pb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#b57614] uppercase tracking-wider mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Standard Operating Procedure (SOP)</span>
            </div>
            <h2 className="text-lg font-black text-[#282828]">
              {activeAgent.name} &middot; {activeAgent.role}
            </h2>
          </div>

          {/* SOP OBJECTIVES */}
          <div>
            <div className="text-[11px] font-bold text-[#7c6f64] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#427b58]" />
              <span>1. Standard Operational Objectives</span>
            </div>
            <ul className="space-y-1.5 pl-5 list-disc text-xs text-[#3c3836]">
              {sop.objectives.map((obj, i) => (
                <li key={i} className="leading-relaxed">
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          {/* DATA AUTHORIZATION & TARGET SCHEMAS */}
          <div>
            <div className="text-[11px] font-bold text-[#7c6f64] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#076678]" />
              <span>2. Authorized Data Access Directory</span>
            </div>
            
            {/* Clearance Alert Strip */}
            <div className="bg-[#ebdbb2]/50 border border-[#d5c4a1] rounded p-2.5 mb-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#b57614]/10 border border-[#b57614]/30 flex items-center justify-center text-lg font-black text-[#b57614]">
                ★
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#7c6f64]">AUTHORIZATION PRIVILEGE LEVEL:</div>
                <div className="text-xs font-bold text-[#282828] font-mono">
                  LEVEL {sop.clearanceLevel} &mdash; {sop.clearanceName}
                </div>
              </div>
            </div>

            {/* Grid of Data Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sop.authorizedSources.map((source, i) => (
                <div key={i} className="bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">
                      {source.type === 'database' ? '🗄️' : source.type === 'file' ? '📁' : '🔗'}
                    </span>
                    <div>
                      <div className="text-xs font-mono font-bold text-[#282828]">{source.name}</div>
                      <div className="text-[9px] font-mono uppercase text-[#7c6f64]">{source.type} Source</div>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                    source.clearance === 'ADMIN' 
                      ? 'bg-[#cc241d]/10 text-[#cc241d] border border-[#cc241d]/30'
                      : source.clearance === 'WRITE'
                      ? 'bg-[#b57614]/10 text-[#b57614] border border-[#b57614]/30'
                      : 'bg-[#427b58]/10 text-[#427b58] border border-[#427b58]/30'
                  }`}>
                    {source.clearance}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* INTEGRATED SKILLS */}
          <div>
            <div className="text-[11px] font-bold text-[#7c6f64] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#b57614]" />
              <span>3. Integrated Operational Skills</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sop.skillsAndCap.map((skill, i) => (
                <div key={i} className="bg-[#f9f5d7] border border-[#d5c4a1] p-2.5 rounded flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-[#282828] truncate max-w-[120px]" title={skill.name}>
                      {skill.name}
                    </span>
                    <span className="text-xs font-mono font-black text-[#8ec07c]">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="h-1 bg-[#ebdbb2] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8ec07c]" 
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#7c6f64] leading-normal mt-1">
                    {skill.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* STANDARD SQL / COMMANDS */}
          <div>
            <div className="text-[11px] font-bold text-[#7c6f64] uppercase tracking-wider mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-[#cc241d]" />
                <span>4. Authorized Transaction Query / Command Payload</span>
              </div>
              <button
                onClick={() => handleCopyCode(sop.querySample.code)}
                className="px-2 py-0.5 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] text-[#282828] text-[9px] font-bold flex items-center gap-1 border border-[#bdae93] transition-colors"
              >
                {copiedCode ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>

            <div className="bg-[#282828] text-[#ebdbb2] rounded-lg p-3 font-mono text-[11px] leading-relaxed relative border-2 border-[#3c3836] shadow-inner max-h-[160px] overflow-y-auto">
              <span className="absolute top-2 right-2 text-[8px] font-bold text-[#a89984] uppercase bg-[#3c3836] px-1.5 py-0.2 rounded">
                {sop.querySample.lang}
              </span>
              <pre className="whitespace-pre-wrap">{sop.querySample.code}</pre>
            </div>
          </div>
        </div>

        {/* TACTICAL ACTION CONSOLE / LIVE SIMULATOR */}
        <div className="bg-[#282828] text-[#ebdbb2] rounded-lg border-2 border-[#3c3836] p-4 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#3c3836] pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#8ec07c]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a89984]">
                TACTICAL SOP COMPLIANCE SIMULATOR
              </span>
            </div>
            
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                isSimulating
                  ? 'bg-[#3c3836] text-[#7c6f64] cursor-not-allowed border border-[#3c3836]'
                  : 'bg-[#b8bb26] hover:bg-[#98971a] text-[#1d2021] border border-[#79740e]'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isSimulating ? 'Simulating...' : 'Execute SOP Credentials & Run'}</span>
            </button>
          </div>

          {/* TERMINAL SCREEN */}
          <div className="bg-[#1d2021] rounded border border-[#3c3836] p-3 font-mono text-[11px] h-[150px] overflow-y-auto space-y-1 scrollbar-thin">
            {terminalOutput.length === 0 ? (
              <div className="text-[#7c6f64] h-full flex flex-col items-center justify-center text-center">
                <span>_ READY TO TEST OPERATIONAL COMPLIANCE FOR {activeAgent.name.toUpperCase()} _</span>
                <span className="text-[9px] mt-1">Press execute to run credential audit and commit logs.</span>
              </div>
            ) : (
              terminalOutput.map((line, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-[#fabd2f]">&gt;</span>
                  <span className={line.includes('SUCCESS') || line.includes('OK') || line.includes('PASS') ? 'text-[#8ec07c]' : line.includes('Verify') || line.includes('clearance') ? 'text-[#83a598]' : 'text-[#ebdbb2]'}>
                    {line}
                  </span>
                </div>
              ))
            )}

            {isSimulating && (
              <div className="flex gap-2 text-[#8ec07c] items-center text-[10px] animate-pulse">
                <span>&gt;</span>
                <span className="w-1.5 h-3 bg-[#8ec07c]" />
                <span>Executing operations...</span>
              </div>
            )}

            {simulationSuccess && (
              <div className="mt-2 p-2 bg-[#427b58]/10 border border-[#427b58]/40 rounded text-xs text-[#8ec07c] flex items-start gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-bold">COMPLIANCE SECURITY AUDIT PASSED!</div>
                  <p className="text-[10px] text-[#a89984] mt-0.5 leading-normal">
                    Successfully verified {sop.id} credentials. Log and certified knowledge base insight committed safely to <strong>Centralized Corporate Intelligence Ledger</strong>! Check the Knowledge Base tab.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
