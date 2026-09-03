# Rufflo Agent Fleet: Autonomous Company Operating System

Rufflo is an enterprise-grade Autonomous Company Operating System powered by a distributed fleet of AI agents organized into corporate departments with a hierarchical chain-of-command, multi-tier permissions, and real-time execution loops.

---

## 1. Newly Implemented System Modules

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

## 2. Master Open-Source Repository Integration Map

| Component | Official Repository | Exact Package | Rufflo Directory | Core Functionality |
|---|---|---|---|---|
| **Mastra AI** | [github.com/mastra-ai/mastra](https://github.com/mastra-ai/mastra) | `@mastra/core` | `server/ai/mastra/` | TypeScript agent runtime, model router, memory, tools, workflow graphs, observability |
| **Composio** | [github.com/ComposioHQ/composio](https://github.com/ComposioHQ/composio) | `@composio/core` | `server/integrations/composio/` | SaaS application toolkits, authenticated actions, OAuth provider gateways |
| **LangGraph Workflows** | [github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | `@langchain/langgraph` | `server/workflows/langgraph/` | Stateful cyclical multi-step graph orchestration for complex pipelines |

---

## 2. Directory Structure

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
└── tests/                        # Security and runtime validation test suites
```

---

## 3. Keyboard Shortcuts & Features

- **Quick Search Command Palette (`Cmd + K` or `Ctrl + K`)**:
  - Quickly search across all **Agents & Employees** (Michael, Dwight, Jim, Pam, Angela, Toby, Kelly, Ruflo Coder, etc.).
  - Search and inspect **Fleet Tasks & Standups**.
  - Search across **Corporate Departments & Floorplans**.
  - Trigger System Tools: Sandboxed Node VM / IDE, 24/7 Self-Healing Cockpit, CSE Agent Academy, Repos Hub, View Switcher.
  - Arrow key (`↑` / `↓`) and `Enter` keyboard navigation with instant fuzzy search.

---

## 4. Security & Zero-Trust Policies

1. **Zero-Trust Token Redaction**: Scans all outgoing logs and execution outputs to sanitize GitHub Personal Access Tokens, live Stripe keys, Google API tokens, and authorization headers (`[REDACTED_SECURITY_GATEWAY]`).
2. **Multi-Tenant Isolation**: ToolGateway rejects any tool call missing a valid tenant organization ID.
3. **Webhook Replay Protection**: Blocks replayed webhook payloads exceeding 5 minutes.
4. **Production Isolation**: Blocks direct, unapproved writes to production databases and repositories.

---

## 5. Environment Variables (`.env.example`)

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

## 6. Commands to Run & Verify

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
