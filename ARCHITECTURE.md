# Munderdifflin Control Plane - Architecture Specification
## Command 03: Connect the Real Company

This document defines the architectural blueprints, pipeline flows, and boundary perimeters for connecting our autonomous workforce fleet safely to real-world corporate integrations, databases, source codes, cloud environments, and external web APIs.

---

### 🏛️ The Security Execution Path

To prevent autonomous loops or untrusted external instructs from bypassing boundaries, every single action triggered by an agent or employee bot **MUST** satisfy our isolated zero-trust gateway:

```text
Employee/Agent Profile
    ↓
Policy Evaluation Engine
    ↓
Multidimensional Authorization Checks
    ↓
Tool Gateway Interface
    ↓
Integration Adapters (Git, Database, HTTP, Storage)
    ↓
External Target Systems
    ↓
Output & Result Validation
    ↓
Credential & Secret Redactors
    ↓
Immutable Security Audit Log
    ↓
Episodic Event Memory State
```

---

### 🛡️ System Boundaries & Design Principles

1. **Gatekeepers (Gateway + Policy Engine)**: No agent possesses direct shell or network access. All connections pass through the universal `ToolGateway`, validating against declared worker capabilities (least privilege).
2. **Deterministic Risk Checks**: Every tool call is routed through the `RiskCalculator`. Actions are rated from `LOW` to `CRITICAL`. Any execution triggering `CRITICAL` risk is halted automatically and routes a human-in-the-loop approval request.
3. **Secret Redaction (No Prompts in Logs)**: The `SecretService` scrubs all outputs before saving to logs or rendering in client interfaces, redacting GitHub tokens, database connections, passwords, and cookies.
4. **Tenant Isolation**: Multi-tenant isolation is built into every layer. Queries carry organization identifiers to prevent data breaches across company profiles.
5. **Indirect Injection Shielding**: Web search tools sanitize untrusted HTML pages, disabling command execution vectors hidden inside online text.
