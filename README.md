# Rufflo Autonomous Company Operating System (ACOS)
## Munderdiffl.in Enterprise Autonomous Fleet & Holographic Command Center

**Rufflo** is a React and Express application exploring AI-assisted company workflows, agent interfaces, orchestration, memory, and integrations. Actual model generation and tool execution depend on configured providers and implemented execution paths; the UI roster does not represent independently operating employees.

> **Capability status:** This repository contains a mix of implemented features, configuration-dependent integrations, and UI/product concepts. A displayed agent, integration, metric, or task status is not proof of independent work. Chat and workflow responses are not task execution unless a separate tool result verifies the action. When no real model or execution backend is available, affected endpoints return a blocked/unavailable response rather than inventing a result. The repository does not currently contain a trained-from-scratch foundation model or a functioning ML training/evaluation pipeline. See [MODEL_DEVELOPMENT_PLAN.md](./MODEL_DEVELOPMENT_PLAN.md) for prerequisites and go/no-go criteria.

---

## 📑 Table of Contents

1. [System Overview & Operating Philosophy](#1-system-overview--operating-philosophy)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Deep-Dive Subsystems & Technical Mechanics](#3-deep-dive-subsystems--technical-mechanics)
   - [3.1. Autonomous Software Construction Engine (`SoftwareBuilder`)](#31-autonomous-software-construction-engine-softwarebuilder)
   - [3.2. Master Orchestrator & Hierarchical Multi-Agent Matrix](#32-master-orchestrator--hierarchical-multi-agent-matrix)
   - [3.3. Master Meta-Agent & Self-Improvement Engine](#33-master-meta-agent--self-improvement-engine)
   - [3.4. Corporate Cascade & Departmental Topology](#34-corporate-cascade--departmental-topology)
   - [3.5. Continuous Discovery & Unlimited Intelligence Engine](#35-continuous-discovery--unlimited-intelligence-engine)
   - [3.6. Spider Web Task-Ring Engine & WebSocket Mesh](#36-spider-web-task-ring-engine--websocket-mesh)
   - [3.7. Composio Autonomous Tool Mesh](#37-composio-autonomous-tool-mesh)
   - [3.8. Zero-Trust Security Grid, Risk Engine & Policy Guard](#38-zero-trust-security-grid-risk-engine--policy-guard)
   - [3.9. Computer Use & Headless Browser Automation (Playwright)](#39-computer-use--headless-browser-automation-playwright)
   - [3.10. Multi-Model AI Routing & Resilient Providers](#310-multi-model-ai-routing--resilient-providers)
   - [3.11. Quantum Superposition & Wavefunction Coherence](#311-quantum-superposition--wavefunction-coherence)
   - [3.12. SRE Telemetry, Chaos Simulation & Self-Healing Daemon](#312-sre-telemetry-chaos-simulation--self-healing-daemon)
4. [Corporate Workforce & Agent Roster Directory](#4-corporate-workforce--agent-roster-directory)
5. [13-Floor Building HQ & Spatial Command Architecture](#5-13-floor-building-hq--spatial-command-architecture)
6. [Frontend UI & Command Modules Catalog](#6-frontend-ui--command-modules-catalog)
7. [Comprehensive REST API & WebSocket Reference](#7-comprehensive-rest-api--websocket-reference)
8. [Persistence & Hybrid Storage Architecture](#8-persistence--hybrid-storage-architecture)
9. [Complete Environment Variable Specification](#9-complete-environment-variable-specification)
10. [Installation, Verification & Deployment Guide](#10-installation-verification--deployment-guide)

---

## 1. System Overview & Operating Philosophy

The product design explores a multi-agent company interface. In the current implementation:

- Gemini and Ollama are usable only when correctly configured and reachable; otherwise model-dependent operations are unavailable.
- Chat and planning endpoints generate responses or proposals; those responses are not evidence of task execution.
- Only implemented tool operations can perform work, and each result must be verified independently. UI status, simulation output, model claims, and roster entries are not execution evidence.
- ML training, model evaluation, CSE certification, and the former static quantum evaluation are unavailable rather than simulated as successful.

---

## 2. End-to-End System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 RUFFLO COMMAND CENTER                                  │
│         Vite + React 19 SPA | Tailwind CSS | Motion | Lucide | D3.js | Three.js        │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ HTTP /ws (Port 3000 / $PORT)
┌──────────────────────────────────────────▼─────────────────────────────────────────────┐
│                          EXPRESS PRODUCTION MICRO-KERNEL                               │
│  - Helmet / Rate Limiting / CORS        - Payload Scanner (SQLi / Injections)          │
│  - Token Authentication & Capabilities  - Cloud Run Dual-Mode (Dev / Production Static)│
├────────────────────────────────────────────────────────────────────────────────────────┤
│                       AUTONOMOUS DISPATCH & ORCHESTRATION                              │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │   MasterOrchestrator   │  │    MasterMetaAgent     │  │  CorporateCascadeEngine  │  │
│  │ (Plan-Code-Exec-Crit)  │  │ (Weekly Self-Heal Loop)│  │   (CEO → HoD → Worker)   │  │
│  └────────────────────────┘  └────────────────────────┘  └──────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                            REAL-TIME COMMUNICATION MESH                                │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │           Spider Web Task-Ring Engine (WebSocket: /ws/spider, /ws/department)     │  │
│  │     Failover Ring | Swarm Solve | Auto-Solve Next | Direct Agent Collaboration    │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                           CONTROL PLANE & SECURITY GATEWAY                             │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │      ToolGateway       │  │      PolicyEngine      │  │      RiskCalculator      │  │
│  │ (Multi-Tenant Enforce) │  │  (Clearance / Approvals)│  │ (LOW/MED/HIGH/CRITICAL)  │  │
│  └────────────────────────┘  └────────────────────────┘  └──────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Credential Redaction Gate: Sanitize GitHub Tokens, Stripe Keys, Gemini Keys      │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                           EXECUTION ADAPTERS & RUNTIMES                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │SoftwareBuild │  │Playwright DOM│  │ Composio SDK │  │ CodeSandbox │  │ Git & HTTP │ │
│  │(Gemini LLM)  │  │(Headless Nav)│  │ (3P SaaS Hub)│  │ (Node VM)   │  │ Adapters   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  └────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                           PERSISTENCE & KNOWLEDGE GRAPHS                               │
│  - Company DB (company_db.json)        - Episodic Knowledge Graph (.rufflo-memory)     │
│  - Supabase PostgreSQL Dual Sync       - Real-Time EventBus (InMemory & PubSub)        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Deep-Dive Subsystems & Technical Mechanics

### 3.1. Autonomous Software Construction Engine (`SoftwareBuilder`)
Located in `server/core/builder/software-builder.ts`, this engine enables agents to autonomously construct production-ready code modules on disk from natural language briefs.
- **Architectural Synthesis**: When invoked, it sends the request through the `modelRouter` to Gemini 2.5/Flash with custom system prompts enforcing clean TypeScript interfaces, strict types, error handling, and unit test harnesses.
- **Path Isolation & Sandboxing**: All file writes pass through the `ProjectWriterAdapter` (`apps/control-plane/integrations/adapters/project-writer.adapter.ts`), strictly enforcing canonical sandbox paths (`generated/`, `src/generated/`) and blocking directory traversal (`../`).
- **Automatic Barrel Integrator**: Dynamically generates `index.ts` files that export all components, interfaces, and utilities generated in the cycle.
- **Automated Smoke-Test Runner**: Generates and executes a runnable verification script (`*.run.ts`) in an isolated context using `CodeExecutionAdapter`. If a runtime syntax or execution error occurs, it feeds back error traces for self-correction.
- **Knowledge Memory Ingestion**: The resulting build output, along with its execution telemetry, is committed into `knowledgeGraph` as a persistent episode.

### 3.2. Master Orchestrator & Hierarchical Multi-Agent Matrix
Located in `server/core/orchestration/master-orchestrator.ts`, this coordinates complex goals using a 6-stage critique loop:
1. **Planner (`michael`)**: Deconstructs high-level objectives into sequential or parallel steps, assigning roles and inputs.
2. **Researcher (`stanley`)**: Sweeps internal memory and external search engines to gather context, API documentation, or code samples.
3. **Coder (`ruflo`)**: Employs the `SoftwareBuilder` pipeline to implement software or configuration files.
4. **Executor (`pete`)**: Runs tests, triggers API calls, or applies system updates.
5. **Critic (`toby`)**: Analyzes execution traces, inspects security risks, and rates solution quality from 0.0 to 1.0. If the score falls below threshold, it requests re-planning.
6. **Synthesizer (`michael`)**: Summarizes the entire workflow, logging the outcome to the audit ledger and returning the final payload.

### 3.3. Master Meta-Agent & Self-Improvement Engine
Located in `server/agents/orchestration/master-meta-agent.ts`, the Master Meta-Agent acts as an autonomous Chief Technology & Operations Officer:
- **Continuous Department Observation**: Computes a dynamic department health score (0–100) based on task throughput, error rates, agent utilization, and failure spikes.
- **Empirical Skill Calibration**: Detects "weak agents" whose success rate drops below 75% or whose latency is disproportionate.
- **Autonomous Improvement Cycles**: Runs automatically every 7 days (or on-demand via `POST /api/meta/improve`). Synthesizes custom training scenarios, updates role instructions, and calibrates prompt parameters.

### 3.4. Corporate Cascade & Departmental Topology
Located in `server/core/autonomy/corporate-cascade.engine.ts`, this mimics an enterprise command chain:
- **Top-Down Cascade**: Objectives submitted to Executive Command (Level 13) are recursively broken down into departmental goals (Level 12 to 10), translated into Standard Operating Procedures (SOPs), and scheduled into worker agent queues.
- **Bottom-Up Reporting**: As workers complete tasks, metrics roll up into departmental summaries and ultimately into the executive building briefing.
- **10-Agent Autonomous Engineering Department**:
  - `Engineering Director`
  - `Lead AI Research Scientist`
  - `Lead Frontend Engineer`
  - `Senior Backend Engineer`
  - `Full-Stack Systems Engineer`
  - `DevOps & Infrastructure Architect`
  - `QA & Test Automation Lead`
  - `Cybersecurity & Compliance Officer`
  - `Database Architect`
  - `Autonomous Prompt Engineer`

### 3.5. Continuous Discovery & Unlimited Intelligence Engine
Located in `server/ai/company/knowledge/discovery.engine.ts`, this provides unprompted market and technological awareness:
- **Live Intelligence Sources**:
  1. *Google Search Grounding* via Gemini Search tools when configured.
  2. *Hacker News Algolia* for live technology stories.
  3. *arXiv CS.AI and CS.SE API* for computer science preprints.
  4. *BrowserService* for fetching and enriching discovered source pages.
- **Continuous Background Loop**: Runs one online discovery scan every minute, rotating between technology, research papers, and market developments (a complete category cycle takes about 3 minutes). Offline or empty searches return no new findings rather than synthetic articles.
- **Proactive Research Pipeline (`ResearchManager`)**: When discoveries are registered, the system queues proactive deep research, dispatching researcher agents to scrape URLs via `BrowserService` without requiring user confirmation.
- **Autonomous Knowledge Distribution (`KnowledgeDistribution`)**: Extracts actionable concepts and automatically injects them into the skills and memories of relevant employees across the company.
- **Engineering Guardrail**: Research updates agent knowledge and capabilities; source-code changes are made through explicit engineering/build tasks rather than rewriting the running agents on every scan.

### 3.6. Spider Web Task-Ring Engine & WebSocket Mesh
Located in `server/spider/task-ring.ts`, this provides low-latency inter-agent communication:
- **Dual WebSocket Endpoints**: `/ws/spider` and `/ws/department`.
- **Message Types**:
  - `COMMAND`: Direct administrative instruction.
  - `ASSIGN_TASK`: Allocates a task to an agent in the ring.
  - `COMPLETE_TASK`: Signals step resolution and triggers dependents.
  - `FAILOVER`: Immediately transfers task execution to a backup agent if the primary times out.
  - `SWARM_SOLVE`: Distributes a large objective simultaneously across all agents in the ring.
  - `AUTO_SOLVE_NEXT`: Pulls the highest priority item from the shared queue.
  - `COLLABORATE`: Connects two agents in a direct dialogue channel to solve a blocked task.

### 3.7. Composio Autonomous Tool Mesh
Located in `server/integrations/composio/` and `server/routes/composio.routes.ts`:
- **Universal SaaS Connectivity**: Bridges the fleet to GitHub, Slack, Gmail, Google Calendar, Jira, Asana, Notion, and Discord.
- **Dynamic Tool Execution**: Executes Composio actions (e.g., `GITHUB_STAR_A_REPO`, `WEATHER_GET_WEATHER`, `HACKERNEWS_GET_TOP_STORIES`) with argument validation, real-time error tracking, and fallback simulation.
- **Live Account Synchronization**: In-memory connection manager synchronized with Composio API keys to track authenticated app sessions.

### 3.8. Zero-Trust Security Grid, Risk Engine & Policy Guard
Located in `apps/control-plane/integrations/` and `risk-engine/`:
- **Multidimensional Clearance Tiers**:
  - `PUBLIC`: Read-only queries, status endpoints.
  - `SECURE`: Standard task creation, internal agent communication.
  - `ADMIN`: File mutation, database schema alterations, credential management.
- **Risk Calculator (`RiskCalculator`)**: Evaluates every tool execution against defined risk vectors:
  - `LOW`: Safe read queries (e.g., weather, time, read-file).
  - `MEDIUM`: Reversible writes, outbound HTTP webhooks.
  - `HIGH`: Code execution in sandboxes, repository branch pushes.
  - `CRITICAL`: File deletion, root config modifications, production deployments.
- **Human-In-The-Loop Approval Gates**: Any operation flagged as `CRITICAL` halts execution and enters the approval queue (`GET /api/approvals`) awaiting explicit clearance.
- **Secret Redaction Gate**: Regex sanitizers inspect all outputs, replacing tokens matching GitHub PATs, Stripe Secret Keys, Gemini API Keys, and Supabase service keys with `[REDACTED_SECURITY_GATEWAY]`.
- **Payload Scanner**: Express middleware (`server/security/payloadScanner.ts`) analyzes incoming bodies for SQL injection patterns, path traversal (`../`), and command injection tokens.

### 3.9. Computer Use & Headless Browser Automation (Playwright)
Located in `server/tools/browser/browser.service.ts`:
- **Playwright Chromium Sandbox**: Launches headless Chromium instances with `--no-sandbox` and `--disable-dev-shm-usage`.
- **Actions Supported**: `navigate`, `click`, `type`, `extract_text`, `screenshot`, and `evaluate`.
- **Resilient Fallback**: In environments without Chromium binaries or under memory pressure, it seamlessly falls back to an HTTP fetch + Cheerio scraping engine, ensuring zero crashes.

### 3.10. Multi-Model AI Routing & Resilient Providers
Located in `server/ai/providers/`:
- **Gemini Provider (`gemini.provider.ts`)**: Uses the `@google/genai` SDK when `GEMINI_API_KEY` is configured. The request uses `GEMINI_MODEL` or the configured default; transient errors receive one retry. Configure and verify the selected model with the provider before relying on it.
- **Local Ollama Provider (`ollama.provider.ts`)**: Uses an Ollama service only when it is running and reachable.
- **Model Router (`model-router.ts`)**: Tries configured real providers and reports an error if none can produce a response. It does not synthesize a response when providers are unavailable; provider order is not a measured model-quality ranking.

### 3.11. Quantum Superposition & Wavefunction Coherence
The former quantum-evaluation endpoint returned fixed, unmeasured candidate probabilities and performance claims. It now responds as unavailable (`501`) because the repository has no quantum evaluation implementation or benchmark. Do not use quantum terminology or the former static metrics as evidence of optimization.

### 3.12. SRE Telemetry, Chaos Simulation & Self-Healing Daemon
Located in `server/routes/system-telemetry.routes.ts` and `server/routes/chaos-simulation.routes.ts`:
- **Real-Time SRE Telemetry**: Monitors V8 Heap Used, Heap Total, Event Loop Latency, Process Uptime, and Memory Leak Risk Index.
- **Synthetic Fault Injection**:
  - *React Hook Loop Leak*
  - *AST Tokenizer Memory Crash*
  - *Sandbox Scoping Violation*
- **Toby's Self-Healing Daemon**: Hot-patches memory references, flushes leaked buffers, restores stable AST nodes, and re-stabilizes the fleet without requiring server restarts.

---

## 4. Corporate Workforce & Agent Roster Directory

The fleet comprises 16 core employees, each with distinct clearance levels, authorities, and specialized capabilities:

| Employee ID | Name | Role Title | Department | Clearance | Authority | Specialization |
|---|---|---|---|---|---|---|
| `michael` | Michael G. Scott | Fleet Commander & CEO | Executive Command | `ADMIN` | 100 | Strategy, Orchestration, Cascade Delegation |
| `dwight` | Dwight K. Schrute | Chief Security Officer | Security & Defense | `ADMIN` | 95 | Threat Defense, Policy Enforcement, Surveillance |
| `jim` | Jim Halpert | VP of Strategic Sales | Sales & Client Operations | `SECURE` | 82 | Client Negotiation, Pipeline Growth, Pranks |
| `pam` | Pam Beesly Halpert | Director of Internal Comms | Communications & UX | `SECURE` | 80 | Fleet Messaging, Tone Analysis, UI Layouts |
| `angela` | Angela Martin | Head of Corporate Finance | Finance & Accounting | `ADMIN` | 90 | Budget Auditing, Ledger Compliance, Zero Variance |
| `kevin` | Kevin Malone | Senior Data Analyst | Finance & Analytics | `PUBLIC` | 45 | Numerical Analysis, Batch Ingestion, Chili Security |
| `oscar` | Oscar Martinez | Chief Compliance Auditor | Finance & Ethics | `SECURE` | 85 | Tax Auditing, Logic Verification, Fact Checking |
| `stanley` | Stanley Hudson | Senior Web Research Specialist | Research & Intelligence | `PUBLIC` | 65 | Deep Web Search, Crossword Parsing, Quiet Quitting |
| `phyllis` | Phyllis Vance | Strategic Partnership Lead | Enterprise Outreach | `SECURE` | 74 | Partner Relations, B2B Trust, Cold Outreach |
| `creed` | Creed Bratton | Black-Hat Resilience Tester | Chaos Engineering | `SECURE` | 88 | Darknet Scraping, Chaos Testing, Unknown Operations |
| `meredith`| Meredith Palmer | Fleet Logistics Coordinator | Supply Chain & Logistics | `PUBLIC` | 55 | Resource Procuring, Emergency Sourcing |
| `kelly` | Kelly Kapoor | Social Engagement Director | Marketing & Social Media | `PUBLIC` | 60 | Trend Monitoring, Viral Sentiment Analysis |
| `ryan` | Ryan Howard | Disruptive Tech Futurist | Innovation Incubator | `SECURE` | 72 | Web3, Disruptive Concept Synthesis, WUPHF 2.0 |
| `toby` | Toby Flenderson | Lead HR & Self-Healing SRE | Compliance & SRE | `ADMIN` | 92 | SRE Health, Auto-Healing, AST Diagnostics |
| `darryl` | Darryl Philbin | VP of Infrastructure | Operations & DevOps | `SECURE` | 84 | Docker, Cloud Run Scaling, Deployment Pipes |
| `pete` | Pete Miller | Lead Software Implementation | Engineering | `SECURE` | 78 | Code Writing, AST Generation, Build Pipelines |

---

## 5. 13-Floor Building HQ & Spatial Command Architecture

The visual Headquarters is rendered as a 13-story corporate skyscraper with departmental distribution:

- **Level 13: Rooftop Innovation Observatory (`ROOF`)**: Fleet Commander holographic command, quantum alignment indicators.
- **Level 12: Executive Boardroom & Strategy Suite (`EXEC`)**: Michael Scott, corporate cascade origin.
- **Level 11: Artificial Intelligence Research Lab (`AIRL`)**: arXiv preprints, prompt synthesis, ML research.
- **Level 10: Advanced Software Engineering Center (`ENG`)**: 10-agent engineering department, SoftwareBuilder engine.
- **Level 9: Cloud Infrastructure & SRE Control (`OPS`)**: DevOps, Cloud Run telemetry, self-healing terminals.
- **Level 8: Cyber Security & Threat Intelligence (`SEC`)**: Dwight Schrute, zero-trust policy evaluation, audit ledgers.
- **Level 7: Enterprise Marketing & Brand Strategy (`MKT`)**: Kelly Kapoor, viral trend monitors, sentiment pipelines.
- **Level 6: Global Sales & Account Operations (`SALES`)**: Jim Halpert, customer negotiation matrix, quota trackers.
- **Level 5: Financial Operations & Audit Vault (`FIN`)**: Angela Martin, Oscar Martinez, zero-tolerance budget auditing.
- **Level 4: Human Resources & Compliance (`HR`)**: Toby Flenderson, fleet mental health, conflict arbitration.
- **Level 3: Strategic Partnerships & Legal Counsel (`LEGAL`)**: Contracts, compliance checks, risk mitigation.
- **Level 2: Supply Chain & Physical Logistics (`LOG`)**: Meredith Palmer, resource routing, hardware procurement.
- **Level 1: Ground Lobby & Public Visitor Center (`LOBBY`)**: Guest check-in, public API hub, external integrations.

---

## 6. Frontend UI & Command Modules Catalog

The user interface provides instant access to all autonomous operations:

1. **Global Command Palette (`Cmd + K` or `Ctrl + K`)**:
   - Fuzzy search indexing all agents, active tasks, standard operating procedures, and building floors.
   - Arrow-key traversal (`↑` / `↓`) and direct selection execution.
2. **Command Center & Fleet Telemetry Grid**:
   - **Agent Fleet Telemetry Grid**: Live multi-agent status matrix with real-time throughput metrics (tokens/second, lifetime tokens, active mission).
   - **Dynamic Heartbeat Visual Animation**: Agent avatars pulse with an organic, cardiac-paced glowing halo (`avatar-heartbeat` & `avatar-heartbeat-ring`) where pulse cadence (resting 2.4s down to 0.75s peak) and glow intensity/scale vary dynamically with the agent's real-time token processing load factor ($0.0 - 1.0$).
   - **Micro-Sparkline Heartbeat Variability Tooltip (`SmartSuggestionTooltip.tsx` & `HeartbeatVariabilitySparkline.tsx`)**: Hovering over any agent card reveals a high-resolution 60-second SVG sparkline graph plotting the agent's Heartbeat Variability (HRV in milliseconds RMSSD) alongside the instantaneous Token Processing Load curve. Highlights Pearson correlation ($r = +0.85$ to $+0.99$) between token processing volume and pulse intensity, with interactive scrubbing, cadence (BPM), and AI next-best-mission recommendations.
   - Quantum superposition alignment controls and quantum path difficulty scores.
   - Text-to-speech voice engine toggle to vocalize agent thoughts in real-time.
3. **13-Floor Interactive HQ Floorplan Viewer**:
   - Visual architectural layout of all 13 floors with active agent counts and departmental statuses.
4. **IDE Dev Suite & Autonomous Software Builder (`IdeModal.tsx`)**:
   - Direct interface to the `SoftwareBuilder` pipeline.
   - Select programming language (`TypeScript`, `React Component`, `JavaScript`).
   - Live code viewer, AST explorer, and smoke-test execution console.
5. **Composio Integration Hub (`ComposioHubModal.tsx`)**:
   - Connect and manage third-party SaaS toolkits (GitHub, Slack, Jira, Gmail).
   - Execute arbitrary Composio actions and monitor output streams.
6. **DevOps SRE Telemetry & Continuous Debugger (`ContinuousDebuggerModal.tsx`)**:
   - V8 memory metrics, CPU load, and event loop latency charts.
   - Synthetic error injection triggers and Toby's Self-Healing one-click daemon.
7. **Engineering Agent Competency Profiles (`engineeringCompetencies.ts`)**:
   - Programming-language, object-oriented design, data-structure, algorithmic problem-solving, testing, and security practices are attached to engineering and related agents and injected into their execution prompts.
8. **Predictive Load Balancer (`PredictiveLoadBalancerModal.tsx`)**:
   - Visual task queue management, worker load metrics, and automated balancing.
9. **Public API Integrator Hub (`PublicApiHubModal.tsx`)**:
   - Test and feed live external APIs (Weather, Crypto, Custom REST) into agent reasoning streams.
10. **Deployment Pipeline & Hotfix Manager (`DeploymentPipelineModal.tsx`)**:
    - Manage hotfix releases, review patches, and promote builds to production.
11. **Virtual AI Corporation Command Center (`VirtualCorporationView.tsx`)**:
    - **Continuous Optimization & Autonomous Remediation Engine ("Start Working On It")**: Comprehensive scanner and automated remediation pipeline addressing the six core operational inefficiencies:
      - *Repetitive Work*: Identifies redundant manual executions and deploys event-driven background daemons with deduplicating semantic state caches (saving up to 16.5 hrs/week).
      - *Bottlenecks*: Detects single-point approvals and overloaded employees (>85% workload), dynamically rebalancing queues across peer specialists and updating delegation policies.
      - *Expensive Processes*: Isolates context-dump operations and circular multi-model reasoning loops, introducing AST pre-filtering and complexity-tiered routing to slash monthly token expenditure by over 60%.
      - *Slow Workflows*: Analyzes sequential await chains and sleep timeouts, refactoring DAGs into asynchronous Fan-Out/Fan-In concurrent matrix pipelines (reducing turnaround latency from 38 mins to 1.4 mins).
      - *Failures as First-Class Memory*: Resolves 429 gateway rate-limits and container memory boundaries with adaptive token-bucket leaky limiters and self-healing circuit breakers.
      - *Unnecessary Manual Steps*: Replaces conservative manual confirmation gates with zero-touch, policy-guarded validation logging to the immutable audit ledger.
    - **Company Brain Strategic War Room**: Live AI executive reasoning answering the 8 canonical strategic questions (Objectives, Work Required, Workforce Assignment, Resources, Missing Info, Risks, Past Precedents, Next Actions).
    - **Organizational Hierarchy & Persistent Employee Dossier**: Deep organizational tree from Founder and Executive Office down to Teams and Specialists with verified skill proficiencies, sandboxed computer environments, and performance KPIs.
    - **Cross-Departmental Projects & Programs Matrix**: Multi-tier tracking from Portfolios and Programs down to Milestones and Tasks with cross-department staffing.
    - **World Intelligence & Continuous Discovery Stream**: Real-time radar scanning arXiv, GitHub, and frontier AI developments with automated relevance scoring and department distribution.
    - **Persistent Workflows**: Multi-stage business processes with dependency enforcement, compensation rollbacks, and approval gates.
    - **Explicit Decisions Ledger**: Consequential decisions documented with alternatives, evidence, risks, and actual measured outcomes.
    - **Failures as First-Class Knowledge**: Comprehensive failure analysis repository tracking root causes, attempted fixes, and permanent prevention strategies.
    - **Zero-Trust Governance & Audit Trail**: Traceable ledger recording WHO, WHAT, WHEN, WHY, TOOL, AUTH, INPUT, and RESULT.

---

## 7. Comprehensive REST API & WebSocket Reference

### Core System & Health
- `GET /api/health` | `GET /healthz` | `GET /health`: System health, process uptime, and timestamp.
- `GET /api/telemetry`: V8 memory, CPU, leak indices, and active system alerts.

### Virtual Corporation & Company Brain Subsystems
- `GET /api/corporation/overview`: Full corporate overview, capital balance, valuation, and subsystem summary.
- `GET /api/corporation/departments`: Complete list of corporate departments with team structures and headcount.
- `POST /api/corporation/departments`: Dynamically create or reorganize corporate departments.
- `GET /api/corporation/employees`: Complete persistent virtual employee roster with full capabilities, clearance, and metrics.
- `GET /api/corporation/employees/:id`: Individual persistent employee dossier.
- `POST /api/corporation/employees`: Deliberately commission a persistent virtual employee to fill verified capability gaps.
- `POST /api/corporation/brain/consult`: Query the Executive Company Brain on strategy, work, workforce, or risks.
- `GET /api/corporation/projects`: List portfolios, programs, projects, milestones, and corporate tasks.
- `POST /api/corporation/projects`: Create and staff a cross-departmental corporate project.
- `GET /api/corporation/discoveries`: List world intelligence discoveries and tech adoption statuses.
- `POST /api/corporation/discoveries/scan`: Trigger an autonomous world discovery sweep across research and open-source models.
- `GET /api/corporation/knowledge`: Query the 11-layer corporate knowledge engine.
- `POST /api/corporation/knowledge`: Record verified knowledge items with full provenance.
- `GET /api/corporation/workflows`: Retrieve persistent multi-agent business process workflows.
- `POST /api/corporation/workflows/:id/advance`: Advance or approve a workflow step.
- `POST /api/corporation/workflows/:id/approval`: Record an explicit `approved` or `rejected` decision with rationale for a step requiring human approval.
- `GET /api/corporation/incidents`: List local incident simulations and department work packets.
- `POST /api/corporation/incidents/simulate`: Create the fixed synthetic credential-exposure tabletop exercise. Requires `{ "confirmedSimulation": true }`; it does not contact external systems or perform containment.
- `POST /api/corporation/incidents/:id/steps/:stepId/complete`: Record 5–2,000 characters of redacted work evidence for the current assigned department packet.
- `POST /api/corporation/incidents/:id/approval`: Approve or reject the simulation disposition with 5–2,000 characters of rationale.
- `GET /api/corporation/decisions`: Retrieve all documented corporate decision records.
- `POST /api/corporation/decisions`: Propose or execute an explicit structured decision.
- `GET /api/corporation/failures`: Retrieve failure records with root causes and permanent prevention strategies.
- `GET /api/corporation/audit`: Searchable zero-trust governance audit log.
- `GET /api/corporation/optimizer/audit`: Comprehensive multi-pillar diagnostic scan covering repetitive work, bottlenecks, expensive processes, slow workflows, failures, and manual steps.
- `POST /api/corporation/optimizer/remediate`: Executes autonomous remediation pipelines ("Start Working On It"), resolving tracked operational inefficiencies, rebalancing workloads, and recording outcomes in Company Memory.
- `GET /api/corporation/optimizer/inefficiencies`: List all detected operational inefficiencies with live metrics and root-cause analyses.
- `GET /api/corporation/optimizer/inefficiencies/:id`: Retrieve single inefficiency diagnostics and verified remediation receipts.

### Orchestration & Software Construction
- `POST /api/orchestrator/run`: Triggers the Master Orchestrator (Plan → Research → Code → Execute → Critic → Synthesizer).
  - *Payload*: `{ "objective": string, "maxSteps"?: number, "requestedBy"?: string }`
- `POST /api/objectives/engineering`: Executes the 10-Agent Engineering Department autonomous construction lifecycle.
- `POST /api/engineering/builder/build`: Direct invocation of the `SoftwareBuilder` pipeline.
  - *Payload*: `{ "objective": string, "language": "typescript"|"react"|"javascript", "outputDir"?: string }`

### Agent Memory
- `POST /api/agent/memory`: Explicitly save an agent-scoped memory. The authenticated organization is assigned by the server; client-supplied organization IDs are not accepted.
  - *Payload*: `{ "agentId": string, "content": string, "tags"?: string[] }`
- `POST /api/agent/memory/search`: Search memories by `query`; optionally restrict to an `agentId`. Without an agent ID, only company-scoped memories are searched.
  - *Payload*: `{ "query": string, "agentId"?: string, "limit"?: number }`
- `POST /api/agent/memory/quantum-search`: Compatibility alias for the ranked memory-search endpoint; returns ordinary retrieval scores, not quantum metrics.

### Meta-Agent & Self-Improvement
- `GET /api/meta/observe`: Returns department health score, success rates, and detected weak agents.
- `POST /api/meta/improve`: Runs the autonomous weekly improvement cycle.

### Discovery & Intelligence
- `GET /api/autonomy/knowledge/discoveries`: Returns registered tech, research, and market discoveries.
- `POST /api/corporation/discoveries/scan`: Triggers an immediate multi-source discovery sweep.
- `POST /api/autonomy/intelligence/query`: Unlimited intelligence query with automatic web sweep on miss.

### Composio & Integrations
- `GET /api/composio/tools`: Lists supported Composio tools.
- `POST /api/composio/execute`: Executes a Composio tool action.
  - *Payload*: `{ "actionId": string, "parameters": object, "userId"?: string }`
- `GET /api/composio/status`: Reports configuration and authenticated app connections.

### Administration & Control Plane
- `POST /api/admin/orchestrate-task`: Executive task delegation to specialized employees.
- `GET /api/approvals`: Lists tasks awaiting human approval.
- `POST /api/approvals/:id/decision`: Approves or rejects a critical-risk operation.

### WebSockets
- `ws://<host>:<port>/ws/spider`: Spider Web task-ring distribution channel.
- `ws://<host>:<port>/ws/department`: Departmental live telemetry and agent communication stream.

---

## 8. Persistence & Hybrid Storage Architecture

Rufflo uses a dual-engine persistent storage architecture:

1. **Local Canonical Store (`company_db.json`)**:
   - Manages building data, floor configurations, department models, employee rosters, project portfolios, and audit events.
   - Synchronously read at boot, atomically flushed on writes.
2. **Supabase PostgreSQL Engine (`supabaseClient.ts`, `supabaseAdmin.ts`)**:
   - Connects to Postgres via Supabase JS SDK.
   - Provides relational persistence for fleet tasks, objectives, and audit trails when credentials are provided.
3. **Episodic Knowledge Graph (`.rufflo-memory/knowledge-graph.json`)**:
   - Persists concept nodes, execution edges, and document links across agent sessions.
4. **Agent Memory (`agent_memories`, `server/ai/mastra/memory`)**:
   - Uses organization-scoped Supabase rows and PostgreSQL full-text indexes in production.
   - Uses an atomically replaced, git-ignored `.rufflo-memory/agent-memories.json` file in local development; set `RUFFLO_MEMORY_FILE` to override its location.
   - Search ranks actual text and tag matches (lexical retrieval, not embeddings). Each agent retains the latest 50 records per organization; company and department memories are isolated by organization.
   - Memory content is secret-redacted before storage; production memory operations fail closed if server-side Supabase credentials are missing.
   - Apply `supabase/migrations/20261018000000_agent_memories.sql` before enabling production memory.
   - Run `npm run test:memory` to verify local persistence, relevance ranking, organization isolation, and secret redaction.

---

## 9. Complete Environment Variable Specification

Defined in `.env.example`:

| Variable | Description | Required | Example |
|---|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API Key for code generation and agent reasoning | Yes (for AI features) | `AIzaSy...` |
| `RUFFLO_DEV_AUTH` | Bypasses strict bearer auth in local development | Optional | `"true"` |
| `PORT` | HTTP port for server binding (Cloud Run passes 8080) | Optional | `3000` |
| `APP_URL` | Absolute base URL of the deployment | Optional | `https://...` |
| `COMPOSIO_API_KEY` | API Key for Composio SaaS toolkits | Optional | `comp_...` |
| `GITHUB_TOKEN` | GitHub Personal Access Token for repository operations | Optional | `ghp_...` |
| `SUPABASE_URL` | Supabase project URL (server-side) | Optional | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (never exposed to client) | Optional | `eyJh...` |
| `VITE_SUPABASE_URL` | Client-accessible Supabase project URL | Optional | `https://xyz.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client-accessible Supabase anon key | Optional | `eyJh...` |
| `OPEN_WEBUI_URL` | URL for external Open WebUI instance | Optional | `http://localhost:8080` |
| `OPEN_WEBUI_API_KEY` | Bearer token for Open WebUI instance | Optional | `sk-...` |
| `OLLAMA_BASE_URL` | URL for local Ollama instance | Optional | `http://localhost:11434` |
| `OLLAMA_MODEL` | Default model tag for Ollama | Optional | `"llama3.2"` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot token for fleet chat integration | Optional | `123456:ABC...` |

---

## 10. Installation, Verification & Deployment Guide

### Prerequisites
- Node.js `v22.x` or higher
- npm `v10.x` or higher

### 1. Installation
```bash
npm install
```

### 2. Development Mode
Runs the backend with tsx and Vite in middleware mode on port `3000`:
```bash
npm run dev
```

When opened in VS Code, the workspace also starts the development server automatically. Allow automatic tasks for this workspace when VS Code asks. To enable them later, run **Tasks: Manage Automatic Tasks in Folder** from the Command Palette and select **Allow Automatic Tasks**. The app URL only loads while the server is running; the folder-open task starts it and waits for the server health check before reporting ready.

### 3. Type Checking
Verifies type safety across all TypeScript files:
```bash
npm run typecheck
```

### 4. Code Quality & Linting
Runs the TypeScript compiler check:
```bash
npm run lint
```

### 5. Running the Security Test Suite
Executes the comprehensive multi-tenant isolation, risk engine, and security policy test suite:
```bash
npm test
```

### 6. Production Compilation
Builds the Vite client into `dist/` and bundles `server.ts` into a CommonJS bundle at `dist/server.cjs`:
```bash
npm run build
```

### 7. Production Server Execution
Starts the production server. Automatically detects Cloud Run environment variables (`PORT`, `K_SERVICE`) and serves static client assets alongside all REST and WebSocket routes:
```bash
npm start
```
