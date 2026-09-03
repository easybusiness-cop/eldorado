# 👥 Human-in-the-Loop Approvals & Secrets

This document explains our multi-stage Approvals system and Secret redaction guardrails.

## Human Approvals Flow

- **Trigger Conditions**: High-risk activities (such as merging pull requests, uploading invoice finance entries, database updates) or policy-triggered rules require human-in-the-loop validation.
- **Workflow State Engine**:
  - `PENDING`: Request received, execution halted, await decision.
  - `APPROVED`: Authorized. Triggers execution with original parameters locked.
  - `REJECTED`: Request denied, execution terminated.
  - `EXECUTED`: Target action completed successfully.

---

## Secrets Management Policy

- **No Raw Credentials**: Raw keys, connection strings, or authorization passwords MUST NEVER reside in source codes, prompt parameters, or database tables.
- **Vault Abstraction**: Secrets are stored under a HashiCorp-compatible Dev/Prod Vault provider.
- **Regex Redaction Engine**: A dedicated cleaner scrubs tokens, bearer headers, passwords, and authorization hashes before logging or exporting telemetry.
