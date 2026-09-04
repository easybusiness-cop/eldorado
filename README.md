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

## 📋 Granular Feature Directory & Function Walkthrough

Below is a detailed guide specifying every visual module, button action, input field, and output response integrated into the Rufflo Command Network.

### 1. ⌨️ Global Command Palette (`Cmd + K` or `Ctrl + K`)
A keyboard-driven command-center shortcut that allows instant directory traversal and application routing:
- **`Search Input Field`**: Uses fuzzy search to index active agent employee cards, running tasks, standard operating procedures, and 13-floor building department layouts.
- **`Navigation List`**: Selectable list items displaying direct navigation tags. Supports arrow keys (`↑` / `↓`) and `Enter` keys to run actions without mouse clicks.
- **`Quick Commands`**: Triggers quick functions including mounting a sandbox terminal, checking real-time database connections, opening the Agent Academy, or launching Toby’s Self-Healer.

### 🏢 2. Munder Diffl.in Enterprise Dashboard & Agent Roster
The central control panel tracking fleet performance, authority levels, and quantum superposition alignment:
- **`Agent Card Grid`**: Renders 16 specialized corporate employees (Michael, Dwight, Jim, Pam, Angela, Creed, etc.) with:
  - **`Authority Level Meter`**: Visual meter displaying authorization scale (Level 1 to Level 100).
  - **`Clearance Level Badge`**: Tags displaying permissions classifications (`ADMIN`, `SECURE`, or `PUBLIC`).
  - **`Quantum Alignment Button`**: Triggers a simulated quantum phase coherence calculation, plotting the agent's wavefunction superposition probability.
- **`Voice Speech Toggle`**: Dynamically toggles speech synthesis, allowing agent diagnostic descriptions and logs to be spoken aloud.
- **`Task Dispatch Panel`**: Input fields to assign tasks to specific agents, set high/low priority, and track execution percentage loops.

### 🌐 3. Live Public API Integrator Hub & workbench
An interactive data engine built to feed live public APIs directly into employee agent reasoning matrices:
- **`Endpoint Selector Tab`**: Switch between preconfigured live external routes:
  - **Open-Meteo Weather**: Live weather and atmospheric forecasts for New York or Tokyo.
  - **CoinGecko Crypto**: Live cryptocurrency market rates for BTC, ETH, and SOL.
  - **JSONPlaceholder DB**: Static mock tables for testing users, posts, and directories.
- **`Query Parameters Overrider`**: Text fields to append custom search parameters or API headers on-the-fly.
- **`Send HTTP Request Button`**: Fires real-time API fetches, printing visual status codes (e.g., `200 OK`), response header parameters, and formatted JSON data blocks.
- **`Agent Pipeline Director`**: Dropdown selectors that pipe the fetched JSON payload to any active agent (Dwight, Creed, etc.) to run compliance scans and append reports.

### 🎓 4. Autonomous CSE Agent Academy & Task Compiler (L3)
An isolated workspace built to design, compile, and publish new operational instructions to the fleet queue:
- **`Specification Input Forms`**: Fields to write high-priority task rules, define clearance categories, and configure instruction prompt structures.
- **`Dry-Run Compiler Simulation Button`**: Starts a multi-phase precheck scanning Abstract Syntax Tree (AST) integrity, safety levels, and security boundaries.
- **`One-Click Dispatch Gateway`**: Registers the fully verified, compiled playbooks directly into the company queue for autonomous execution.

### 🛡️ 5. DevOps SRE Telemetry & Self-Healing Terminal
A real-time control console designed to monitor system health and resolve execution failures:
- **`Start Compiler Loop Button`**: Initiates a dynamic compilation run, stepping through stateful phases: `writing`, `security_audit`, `lint_compile`, and `completed`.
- **`Monospace Compiler Log Stream`**: Live terminal printout rendering raw system compilation outputs.
- **`Fault Injection Dropdown`**: Allows administrators to intentionally trigger synthetic errors to test system resiliency:
  - **Hook Loop Leaks**: Infinite state-mutation loops inside components.
  - **AST Tokenizer Crashes**: Corrupt JSX formatting or broken delimiters.
  - **Sandbox Security Violations**: Unsafe global process/window memory write attempts.
- **`Agent Dialogue Speech Bubble`**: Upon fault detection, the linter catches it, flag-lights the corresponding AST diagram node in vibrant crimson red, and presents a **meaningful, highly contextual dialogue speech bubble** from the responsible diagnostic agent (Ruflo Coder, Dwight Schrute, or Toby Flenderson) explaining the precise root cause and proposing clear solutions.
- **`Self-Heal Daemon Button`**: Executes Toby's automated healer script, hot-patches memory references, restores stable AST nodes, and triggers celebration effects upon recovery.

### 🗄️ 6. Interactive Code Artifact Vault & Sandboxed Testbed
Provides absolute visibility and local download handlers for compiled software files:
- **`Artifact Selection Dropdown`**: Instantly switches code viewer contexts between `App.tsx` (Core Frontend), `TelemetryDashboard.tsx` (Telemetry metrics), and `ComplianceAudit.ts` (SecOps policies).
- **`Quick Copy Button`**: Copies the compiled code block directly to the system clipboard.
- **`Download Anchor Link`**: Synthesizes a local data-URI script and starts an instant standalone file download directly to the desktop.
- **`Execute VM Test-Suite Button`**: Simulates sandboxed V8 execution checks and prints compilation validation checklists.

### 🔌 7. Workspace & Social Media Connectors
Simulates corporate SaaS connections to sync organizational data and automate promotional posts:
- **`Google Workspace Tab`**:
  - **`Gmail Client Fetcher`**: Pulls simulated inbox payloads and email threads.
  - **`Calendar Sync Panel`**: Connects and schedules corporate calendar events.
  - **`Sheets Exporter`**: Outputs current fleet logs into spreadsheet structures.
- **`Social Media Tab`**: Handles automated marketing campaigns, allowing users to write promotional copy and schedule instant campaigns across Instagram and LinkedIn channels.

### 6. 🚀 Autonomous Software Construction & LLM Builder Engine
Allows the fleet to dynamically write real, production-ready code files, assemble barrel exports, and run live smoke tests.
- **Project Writer Adapter (`apps/control-plane/integrations/adapters/project-writer.adapter.ts`)**: Safe file creation and directory management with strict path-traversal prevention.
- **LLM Software Builder (`server/core/builder/software-builder.ts`)**: Gemini-driven code generation that plans, creates source files, generates module index barrel files, and executes smoke tests.
- **Master Orchestrator Integration (`server/core/orchestration/master-orchestrator.ts`)**: Automatically routes structural build objectives directly to the `SoftwareBuilder`.
- **Dev Suite UI (`src/components/IdeModal.tsx`)**: An interactive **Software Builder** tab inside the IDE Dev Suite allowing team members to initiate builds, select target frameworks, inspect generated code previews, and examine execution notes.

### 7. 🌐 Computer Use & Headless Browser Automation (Playwright)
Enables agent fleet members to interact with live web applications and desktop workflows:
- **Playwright-Powered Automation**: Supports `navigate`, `click`, `type`, `extract_text`, `screenshot`, and `evaluate` actions.
- **Visual Capture**: Takes live viewport screenshots and feeds extracted DOM text into agent memory context windows.

### 8. 🧠 Persistent Knowledge Graph & Dynamic Capability Registry
- **Knowledge Graph**: Tracks concepts, relationships, and episodic memory histories across sessions (`.rufflo-memory/knowledge-graph.json`).
- **Dynamic Capability Registry**: Fine-grained role-based capability grants (`CapabilityRegistry`) and risk rules (`RiskCalculator`) enforcing human-in-the-loop approvals for destructive operations.

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
