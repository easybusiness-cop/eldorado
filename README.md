# Rufflo Agent Fleet: Munderdiffl.in Autonomous Command Center

Rufflo is an enterprise-grade **Autonomous Company Operating System** powered by a distributed fleet of AI agents organized into corporate departments with a hierarchical chain-of-command, multi-tier permissions, zero-trust security grids, and real-time software construction loops.

---

## 🏛️ Comprehensive Enterprise System Architecture

Rufflo operates on a highly decentralized, stateful, and secure corporate micro-kernel design. Below are the primary architectural layers powering fleet intelligence, autonomous software construction, sandbox simulations, and browser automation.

### 1. 🚀 Autonomous Software Construction Engine (`SoftwareBuilder`)
A complete agent-integrated software development pipeline that turns high-level objective prompts into production-ready, modular codebases.
```text
[Master Orchestrator / User Prompt]
              ↓
   [SoftwareBuilder Service]
              ↓
 [Gemini LLM Code Synthesizer]  ← Generates multi-file TypeScript/React modules
              ↓
  [Project Writer Adapter]      ← Enforces path sandboxing (/generated, src/generated)
              ↓
  [Barrel Index Integrator]     ← Auto-creates unified export index.ts
              ↓
  [Code Execution Sandbox]     ← Executes live runnable smoke tests
              ↓
  [Knowledge Graph Ingestion]  ← Persists build episode & document node to memory
```
* **Gemini LLM Code Synthesizer**: Uses multi-model fallback cascades (`callGeminiResilient`) to generate production-ready TypeScript, React, or JavaScript source files with JSDocs and clean interface definitions.
* **Project Writer Adapter (`apps/control-plane/integrations/adapters/project-writer.adapter.ts`)**: Enforces path safety (`resolveSafePath`), preventing path-traversal attacks while managing file creations, updates, and directory creation.
* **Barrel Export Generator**: Automatically parses generated TypeScript modules and creates `index.ts` barrel export files for seamless module integration.
* **Automated Smoke-Test Runner**: Uses the `CodeExecutionAdapter` to execute runnable code snippets (`*.run.ts`) in an isolated V8 context to verify zero runtime errors before deployment.

### 2. 🧠 Master Orchestrator & Multi-Agent Planning Matrix
Hierarchical multi-agent coordinator that manages task breakdown, delegation, execution, critique, and synthesis:
* **Role Hierarchy**:
  * `Planner` (`michael`): Deconstructs objectives into actionable multi-phase steps.
  * `Researcher` (`stanley`): Performs multi-hop web research via Google Search adapters.
  * `Coder` (`ruflo`): Automatically triggers `SoftwareBuilder` for structural build objectives.
  * `Executor` (`pete`): Executes generated code or external API actions inside sandboxed environments.
  * `Critic` (`toby`): Reviews output quality, identifies security risks, and assesses execution status.
  * `Synthesizer` (`michael`): Compiles findings, code snippets, and execution logs into a unified response.

### 3. 🛡️ Zero-Trust Multi-Agent Cyber Security Grid
Every action triggered by the autonomous workforce passes through a strict multidimensional gateway prioritizing safety, role limits, and tenant privacy.
```text
[Fleet Agent / Worker Node]
             ↓
[Policy Evaluation Engine]  ← Checks clearance levels (ADMIN, SECURE, PUBLIC)
             ↓
[Risk Calculator Runtime]   ← Ratings (LOW, MEDIUM, HIGH, CRITICAL)
             ↓              → If CRITICAL, halts and triggers Human-In-The-Loop Approval
[Tool Gateway Interface]    ← Sanitizes arguments, ensures tenancy isolation
             ↓
[Integration Adapters]      ← Wrappers for GitHub, Cloud SQL, Workspace, Project Writer
             ↓
[Credential Redaction Gate] ← Sanitizes logs & outputs (GitHub tokens, API keys)
             ↓
[Immutable Security Audit]  ← Persisted in JSON audit logs
```

### 4. 🌐 Computer Use & Headless Browser Automation (Playwright)
Integrates full-featured headless browser capabilities as a universal tool across the employee fleet.
* **Browser Actions**: `navigate`, `click`, `type`, `extract_text`, `screenshot`, and `evaluate`.
* **DOM Coordinates**: Maps HTML DOM elements dynamically to execute accurate user interactions on headless viewports.
* **Visual Context Capture**: Takes viewport screenshots and extracts page text directly into agent context windows for real-time web awareness.

### 5. 🧠 Persistent Knowledge Graph & Dynamic Capability Registry
* **Knowledge Graph (`.rufflo-memory/knowledge-graph.json`)**: Persistent episodic memory store tracking concepts, relationships, execution logs, and architectural document nodes across sessions.
* **Dynamic Capability Registry (`CapabilityRegistry`)**: Granular role-based capability grants with real-time request, approval, grant, and revocation controls.
* **Risk Engine Rules (`risk-engine/risk.rules.ts`)**: Evaluates tool action risk levels, enforcing mandatory human approvals for high-risk and destructive operations (e.g., `delete_file`, `alter_schema`, `merge_pull_request`).

### 6. ⚙️ Continuous SRE DevOps Telemetry & Self-Healing Daemon
* **SRE Metrics Monitor**: Tracks V8 heap allocation, memory leak index scores, event loop latency, and CPU load on active Cloud Run nodes.
* **TypeScript AST Analyzer**: Parses codebase scripts into logical token nodes (`ImportDeclaration`, `VariableDeclaration`, `ReactHook`, etc.) to run policy and syntax verification checks before runtime mounting.
* **Synthetic Fault Injection & Collaborative Healing**:
  * Supports simulated errors: **Hook Loop Leaks**, **AST Tokenizer Crashes**, or **Sandbox Scoping Violations**.
  * Triggers **collaborative agent dialogue panels** where specialized bots (Ruflo Coder, Dwight Schrute, Toby Flenderson) analyze diagnostics and explain root causes.
  * Executes Toby's self-healing daemon to hot-patch memory references, restore stable AST nodes, and update telemetry metrics.

---

## 📋 Granular Feature Directory & Visual Command Modules

Below is a detailed walkthrough of the visual modules and control panels integrated into the Rufflo Command Center.

### 1. ⌨️ Global Command Palette (`Cmd + K` or `Ctrl + K`)
A keyboard-driven command-center shortcut that allows instant directory traversal and application routing:
* **`Search Input Field`**: Uses fuzzy search to index active agent employee cards, running tasks, standard operating procedures, and 13-floor building department layouts.
* **`Navigation List`**: Selectable list items displaying direct navigation tags. Supports arrow keys (`↑` / `↓`) and `Enter` keys to run actions without mouse clicks.
* **`Quick Commands`**: Triggers quick functions including mounting a sandbox terminal, checking real-time database connections, opening the Agent Academy, or launching Toby’s Self-Healer.

### 🏢 2. Munder Diffl.in Enterprise Dashboard & Agent Roster
The central control panel tracking fleet performance, authority levels, and quantum superposition alignment:
* **`Agent Card Grid`**: Renders 16 specialized corporate employees (Michael, Dwight, Jim, Pam, Angela, Creed, etc.) with:
  * **`Authority Level Meter`**: Visual meter displaying authorization scale (Level 1 to Level 100).
  * **`Clearance Level Badge`**: Tags displaying permissions classifications (`ADMIN`, `SECURE`, or `PUBLIC`).
  * **`Quantum Alignment Button`**: Triggers a simulated quantum phase coherence calculation, plotting the agent's wavefunction superposition probability.
* **`Voice Speech Toggle`**: Dynamically toggles speech synthesis, allowing agent diagnostic descriptions and logs to be spoken aloud.
* **`Task Dispatch Panel`**: Input fields to assign tasks to specific agents, set high/low priority, and track execution percentage loops.

### 💻 3. IDE Dev Suite & Autonomous Software Builder
Integrated developer environment for constructing software modules directly inside the platform UI:
* **`Software Builder Tab`**: An interactive control interface for the `SoftwareBuilder` pipeline.
  * **Objective Prompt Field**: Natural-language text area to specify structural coding requirements.
  * **Language Selector**: Choose target framework (`TypeScript`, `JavaScript`, `React Component`).
  * **Target Directory Input**: Set output module target directory (e.g., `modules/security`).
  * **Build Real Software Button**: Triggers `POST /api/engineering/builder/build`, rendering generated source code previews, file trees, and smoke test outputs.
* **`Website Builder Tab`**: Visual component layout editor.
* **`24/7 Self-Healing Tab`**: Telemetry and fault recovery controls.

### 🌐 4. Live Public API Integrator Hub & Workbench
An interactive data engine built to feed live public APIs directly into employee agent reasoning matrices:
* **`Endpoint Selector Tab`**: Switch between preconfigured live external routes:
  * **Open-Meteo Weather**: Live weather and atmospheric forecasts for New York or Tokyo.
  * **CoinGecko Crypto**: Live cryptocurrency market rates for BTC, ETH, and SOL.
  * **JSONPlaceholder DB**: Static mock tables for testing users, posts, and directories.
* **`Query Parameters Overrider`**: Text fields to append custom search parameters or API headers on-the-fly.
* **`Send HTTP Request Button`**: Fires real-time API fetches, printing visual status codes (e.g., `200 OK`), response header parameters, and formatted JSON data blocks.

### 🎓 5. Autonomous CSE Agent Academy & Task Compiler (L3)
An isolated workspace built to design, compile, and publish new operational instructions to the fleet queue:
* **`Specification Input Forms`**: Fields to write high-priority task rules, define clearance categories, and configure instruction prompt structures.
* **`Dry-Run Compiler Simulation Button`**: Starts a multi-phase precheck scanning Abstract Syntax Tree (AST) integrity, safety levels, and security boundaries.
* **`One-Click Dispatch Gateway`**: Registers the fully verified, compiled playbooks directly into the company queue for autonomous execution.

### 🛡️ 6. DevOps SRE Telemetry & Self-Healing Terminal
A real-time control console designed to monitor system health and resolve execution failures:
* **`Start Compiler Loop Button`**: Initiates a dynamic compilation run, stepping through stateful phases: `writing`, `security_audit`, `lint_compile`, and `completed`.
* **`Monospace Compiler Log Stream`**: Live terminal printout rendering raw system compilation outputs.
* **`Fault Injection Dropdown`**: Allows administrators to intentionally trigger synthetic errors to test system resiliency (**Hook Loop Leaks**, **AST Tokenizer Crashes**, **Sandbox Security Violations**).
* **`Self-Heal Daemon Button`**: Executes Toby's automated healer script, hot-patches memory references, restores stable AST nodes, and updates telemetry.

---

## 🗺️ Master Open-Source Repository Integration Map

| Component | Official Repository | Exact Package | Rufflo Directory | Core Functionality |
|---|---|---|---|---|
| **Mastra AI** | [github.com/mastra-ai/mastra](https://github.com/mastra-ai/mastra) | `@mastra/core` | `server/ai/mastra/` | TypeScript agent runtime, model router, memory, tools, workflow graphs |
| **Composio** | [github.com/ComposioHQ/composio](https://github.com/ComposioHQ/composio) | `@composio/core` | `server/integrations/composio/` | SaaS application toolkits, authenticated actions, OAuth provider gateways |
| **LangGraph Workflows** | [github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | `@langchain/langgraph` | `server/workflows/langgraph/` | Stateful cyclical multi-step graph orchestration for complex pipelines |
| **Playwright Browser** | [github.com/microsoft/playwright](https://github.com/microsoft/playwright) | `playwright` | `apps/control-plane/integrations/adapters/` | Headless browser automation, DOM interaction, screenshot capture |

---

## 📁 Directory Structure

```text
├── src/                          # React 19 Frontend Client
│   ├── components/               # UI components, modals, visual HQ & Command Center
│   │   ├── IdeModal.tsx          # IDE Dev Suite & Autonomous Software Builder Tab
│   │   ├── SearchModal.tsx       # Global Cmd/Ctrl+K Quick Search Command Palette
│   │   ├── DynamicKnowledgeBaseModal.tsx # Knowledge Graph & Capability Registry UI
│   │   ├── hq/                   # 13-Floor Building HQ & Floorplan Views
│   │   └── ...
│   └── ...
├── server/
│   ├── ai/                       # Gemini SDK service & Mastra AI agent configuration
│   ├── core/
│   │   ├── builder/              # SoftwareBuilder LLM code generation engine
│   │   ├── orchestration/        # MasterOrchestrator hierarchical planning & execution
│   │   └── memory/               # KnowledgeGraph persistent memory store
│   ├── agents/                   # Fleet state registry & delegation engine
│   ├── departments/              # Department definitions, manager routing & policies
│   ├── security/                 # Secret redactor, multi-tenant guard, auth middleware
│   └── routes/                   # RESTful API routes (/api/*)
├── apps/control-plane/
│   └── integrations/
│       ├── adapters/             # ProjectWriter, ComputerUse, CodeExecution adapters
│       ├── gateway/              # ToolGateway central execution hub
│       └── registry/             # CapabilityRegistry dynamic RBAC definitions
├── risk-engine/                  # Risk rules engine & risk calculator
├── shared/                       # Shared TypeScript interfaces, types & constants
```

---

## 🛡️ Security & Zero-Trust Policies

1. **Zero-Trust Token Redaction**: Scans all outgoing logs and execution outputs to sanitize GitHub Personal Access Tokens, Stripe keys, Gemini keys, and authorization headers (`[REDACTED_SECURITY_GATEWAY]`).
2. **Multi-Tenant Isolation**: `ToolGateway` rejects any tool execution attempt missing a valid tenant organization ID.
3. **Webhook Replay Protection**: Blocks replayed webhook payloads exceeding 5 minutes.
4. **Production & Path Isolation**: `ProjectWriterAdapter` restricts write access to safe directories (`/generated`, `.rufflo-sandbox`), enforcing path-traversal protection.

---

## ⚙️ Environment Variables (`.env.example`)

```env
# Required for Gemini LLM code synthesis and agent reasoning
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Absolute URL binding for preview and webhook callbacks
APP_URL="YOUR_APP_URL"

# Optional: Composio SaaS Toolkits & Integrations
COMPOSIO_API_KEY=""

# Optional: GitHub VCS operations
GITHUB_TOKEN=""
```

---

## 🛠️ Setup, Installation & Verification Commands

### 1. Installation
Install Node.js dependencies:
```bash
npm install
```

Optionally install Playwright browser binaries for Computer Use automation:
```bash
npx playwright install chromium
```

### 2. Development Mode
Start the full-stack development server (Express backend + Vite React frontend on port `3000`):
```bash
npm run dev
```

### 3. Type Checking
Verify full TypeScript type safety across frontend, backend, and control plane:
```bash
npm run typecheck
```

### 4. Code Quality & Linting
Run ESLint and syntax checks:
```bash
npm run lint
```

### 5. Execute Security & Test Suite
Run the security test suite verifying multi-tenant isolation, risk engine rules, credential redactors, and policy evaluation:
```bash
npm test
```

### 6. Production Build & Start
Compile the application bundle and start the CommonJS server:
```bash
npm run build
npm start
```
