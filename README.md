# Rufflo Agent Fleet: Autonomous Company Operating System

Rufflo is an enterprise-grade Autonomous Company Operating System powered by a distributed fleet of AI agents organized into corporate departments with a hierarchical chain-of-command, multi-tier permissions, and real-time execution loops.

---

## 🏛️ Comprehensive Enterprise System Architecture

Rufflo operates on a highly decentralized, stateful, and secure corporate micro-kernel design. Below are the core architectures driving the automated fleet operations, sandbox simulations, and self-healing systems.

### 1. 🛡️ Zero-Trust Multi-Agent Cyber Security Grid
Every action triggered by the autonomous workforce passes through a strict multidimensional gateway prioritizing security, safety, and tenant privacy.
```text
[Fleet Agent / Worker Node]
             ↓
[Policy Evaluation Engine]  ← Checks clearance levels (ADMIN, SECURE, PUBLIC)
             ↓
[Risk Calculator Runtime]  ← Ratings (LOW, MEDIUM, HIGH, CRITICAL)
             ↓             → If CRITICAL, halts and triggers Human-In-The-Loop Approval
[Tool Gateway Interface]   ← Sanitizes arguments, ensures tenancy-isolation
             ↓
[Integration Adapters]     ← Wrappers for GitHub APIs, Cloud SQL, and Workspace HTTP
             ↓
[V8 Sandbox/External Host]
             ↓
[Credential Redaction Gate] ← Sanitizes logs & responses (GitHub tokens, private keys)
             ↓
[Immutable Security Audit]  ← Persisted in JSON audit files
```

### 2. 🌐 Browser-Use Autonomous Headless Automation Architecture
Integrates full-featured headless browser capabilities as a universal tool across the employee fleet.
- **Trace-Action Planners**: When a search or URL parsing instruction is issued, the Browser-Use Engine builds a logical multi-step action tree.
- **DOM Node Intersect Matrices**: Maps HTML DOM elements dynamically to coordinate accurate click, focus, input, and hover instructions on virtual screens.
- **Scraper-Piping Flow**: Feeds real-time output text directly back into agent context windows, augmenting static models with real-time web awareness.

### 3. 🧩 Budibase-Inspired Multi-Step Variable Binding Engine
Facilitates dynamic state propagation and variable handoffs between sequentially executed orchestration steps.
- **Template Context Interpolation**: Steps bind properties dynamically using the standard double-curly-braces syntax (e.g., `{{ steps.1.output }}` or `{{ steps.2.codeSnippet }}`).
- **Dependency Pipeline Graphs**: Generates execution Directed Acyclic Graphs (DAGs) that track parameter prerequisites, preventing execution of child steps until their parent variables successfully resolve.

### 4. ⚙️ Continuous SRE DevOps Telemetry, V8 Compiler & Self-Healing Daemon
An advanced system monitoring and dynamic code hot-patching architecture.
- **Live SRE Metrics Monitor**: Tracks V8 heap allocation, memory leak index scores, event loop latency, and CPU capacity on active Cloud Run nodes.
- **TypeScript AST Analyzer**: Parses generated codebase scripts into logical token nodes (`ImportDeclaration`, `VariableDeclaration`, `ReactHook`, etc.) to run policy and syntax verification checks before runtime mounting.
- **Simulated Fault Injection & Healing Loops**: 
  - Allows intentional injection of software errors like **Hook Loop Leaks**, **AST Tokenizer Crashes**, or **Sandbox Scoping Violations**.
  - Triggers **collaborative agent dialogue panels** where specialized bots (Ruflo Coder, Dwight Schrute, Toby Flenderson) analyze the diagnostics and speak on-screen to explain the root cause.
  - Automatically heals the system, hot-patches memory leaks, restores proper AST nodes, and updates live telemetry.

### 5. 🗄️ Interactive Code Artifact Vault & Sandboxed Testbed
Provides administrators complete visibility and control over all software modules compiled by the autonomous fleet.
- **Interactive Selector Hierarchy**: Navigates generated micro-frontend source files, backend server files, and database schemas with visual syntax highlighting.
- **Data-URI Payload Exporters**: Facilitates direct standalone code downloads directly from browser sandboxes, bypassing file-system restrictions.
- **AST Dry-Run Testbed**: Runs simulated integration assertions on code changes, reporting immediate compliance scoring.

---

## 🚀 Newly Implemented System Modules

### 🌐 Live Public API Integrator Hub & Pipeline Workbench
An interactive API testing terminal and live data routing engine designed to fetch live public datasets and pipe them seamlessly into the autonomous workspace agent queues.
- **Preconfigured Endpoints**: Includes real-time **Open-Meteo Weather forecasts** (Tokyo & New York), live **CoinGecko Crypto Market rates** (BTC, ETH, SOL), and structured **JSONPlaceholder database resources** (Users & Posts).
- **Dynamic Parameter Builder**: Modifies API search queries on-the-fly and displays real-time HTTP response status, headers, and formatted JSON payloads.
- **Agent Pipeline Piping**: Enables users to assign any active agent (Dwight, Michael, Jim, etc.) to immediately parse the live API response payload, verify business rule compliance thresholds, and update local logs.

### 🎓 Autonomous Task Training & Publishing Workstation (Agent Academy L3)
Integrated deep training and curation pipeline situated inside the CSE Agent Academy.
- **Specification Coder**: Lets administrators build customized, high-priority task specifications and operational instructions for specialized agents.
- **Sandboxed Compilation Simulation**: Simulates abstract syntax tree (AST) code scanning, safety temperature adjustments, zero-trust validation checks, and dry-run compilations.
- **One-Click Dispatch Gateway**: Seamlessly registers the verified task template directly into the live company queue for immediate autonomous execution.

---

## 🗺️ Master Open-Source Repository Integration Map

| Component | Official Repository | Exact Package | Rufflo Directory | Core Functionality |
|---|---|---|---|---|
| **Mastra AI** | [github.com/mastra-ai/mastra](https://github.com/mastra-ai/mastra) | `@mastra/core` | `server/ai/mastra/` | TypeScript agent runtime, model router, memory, tools, workflow graphs, observability |
| **Composio** | [github.com/ComposioHQ/composio](https://github.com/ComposioHQ/composio) | `@composio/core` | `server/integrations/composio/` | SaaS application toolkits, authenticated actions, OAuth provider gateways |
| **LangGraph Workflows** | [github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | `@langchain/langgraph` | `server/workflows/langgraph/` | Stateful cyclical multi-step graph orchestration for complex pipelines |

---

## 📁 Directory Structure

```text
├── src/                          # React 19 Frontend Client
│   ├── components/               # UI components, modals, visual HQ & Command Center
│   │   ├── SearchModal.tsx       # Global Cmd/Ctrl+K Quick Search Command Palette
│   │   ├── hq/                   # 13-Floor Building HQ & Floorplan Views
│   │   └── ...
│   └── ...
├── server/
│   ├── ai/
│   │   ├── mastra/               # Primary Mastra agent runtime, tools, memory, traces
│   │   │   ├── agents/           # 16 Specialized autonomous fleet agents
│   │   │   ├── workflows/        # Stateful pipeline execution engine
│   │   │   ├── tools/            # Built-in tool definitions & schema validators
│   │   │   ├── memory/           # Agent & company multi-scope memory store
│   │   │   ├── processors/       # Prompt transformation pipelines
│   │   │   └── observability/    # Real-time agent trace collector
│   │   └── models/               # Multi-model router with resilient fallbacks
│   ├── agents/                   # Fleet state registry, runtime & delegation engine
│   ├── departments/              # Department definitions, manager routing & policies
│   ├── workflows/                # Software dev & marketing workflows + approval queue
│   ├── integrations/             # Composio & VCS integrations (GitHub, Gmail, Slack, etc.)
│   ├── memory/                   # Working, agent, company & project memory services
│   ├── tools/                    # ToolGateway & Zero-Trust Audit Logger
│   ├── security/                 # Secret redactor, multi-tenant guard, authorization
│   └── routes/                   # Clean RESTful API routes (/api/v2/*)
├── shared/
│   ├── types/                    # Shared TypeScript interfaces & types
│   ├── schemas/                  # Task & tool validation schemas
│   └── constants/                # Department budgets, policies, and pipelines
│   └── tsconfig.json             # Root TypeScript options
```

---

## ⌨️ Keyboard Shortcuts & Features

- **Quick Search Command Palette (`Cmd + K` or `Ctrl + K`)**:
  - Quickly search across all **Agents & Employees** (Michael, Dwight, Jim, Pam, Angela, Toby, Kelly, Ruflo Coder, etc.).
  - Search and inspect **Fleet Tasks & Standups**.
  - Search across **Corporate Departments & Floorplans**.
  - Trigger System Tools: Sandboxed Node VM / IDE, 24/7 Self-Healing Cockpit, CSE Agent Academy, Repos Hub, View Switcher.
  - Arrow key (`↑` / `↓`) and `Enter` keyboard navigation with instant fuzzy search.

---

## 🛡️ Security & Zero-Trust Policies

1. **Zero-Trust Token Redaction**: Scans all outgoing logs and execution outputs to sanitize GitHub Personal Access Tokens, live Stripe keys, Google API tokens, and authorization headers (`[REDACTED_SECURITY_GATEWAY]`).
2. **Multi-Tenant Isolation**: ToolGateway rejects any tool call missing a valid tenant organization ID.
3. **Webhook Replay Protection**: Blocks replayed webhook payloads exceeding 5 minutes.
4. **Production Isolation**: Blocks direct, unapproved writes to production databases and repositories.

---

## ⚙️ Environment Variables (`.env.example`)

```env
# Required for autonomous model generation
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Configures absolute URL bindings for OAuth and webhooks
APP_URL="YOUR_APP_URL"

# Optional: Composio SaaS Toolkits & Integrations
COMPOSIO_API_KEY=""

# Optional: GitHub VCS operations
GITHUB_TOKEN=""
```

---

## 🛠️ Commands to Run & Verify

- **Start Development Server**:
  ```bash
  npm run dev
  ```
- **Type Checking (Zero TypeScript Errors)**:
  ```bash
  npm run typecheck
  ```
- **Linter Check**:
  ```bash
  npm run lint
  ```
- **Run Security & Integrity Test Suite**:
  ```bash
  npm test
  ```
- **Production Build**:
  ```bash
  npm run build
  ```
- **Production Start**:
  ```bash
  npm run start
  ```
