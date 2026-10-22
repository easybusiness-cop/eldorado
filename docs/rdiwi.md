# Individual Agent Digital Identity & Workspace Infrastructure

RDIWI assigns each registered or dynamically created agent a durable identity and an organization-scoped Playwright workspace. Identity and workspace records are keyed by `(organization_id, agent_id)`. Dynamic agent creation requires an organization, and an identity is provisioned before the new agent is returned to its caller.

## Runtime behavior

- The Identity Manager creates identity and workspace rows idempotently. A mailbox is absent until an existing Google Workspace account completes OAuth; Rufflo does not create consumer Gmail accounts.
- Each agent uses its own Chromium `BrowserContext`. Playwright storage state is encrypted with a fresh AES-256-GCM data key, wrapped by Google Cloud KMS, and stored as ciphertext in `agent_secret_envelopes`. Encryption binds organization, agent, and purpose as authenticated data.
- The server uses Google Application Default Credentials for Cloud KMS. It has no local key or plaintext fallback. Browser storage is written after navigation and interaction and before a context is closed. A failed save is reported as non-persistent and prevents a normal stop from claiming that state was preserved.
- Browser status summaries contain counts and sanitized URLs only. They never include cookies, cookie domains, user-agent strings, local storage contents, filesystem paths, or auth tokens. Generic browser actions do not echo typed values.
- Agents may request approved capabilities and registered external-account access. An account request is not account creation. A manager approval authorizes the request but leaves the account pending until the existing account is authorized in that agent’s isolated browser. A manager then explicitly confirms the provider authorization; this is an operator attestation, not an automated provider check. Google Workspace uses its OAuth callback instead.
- Google Workspace uses the server-side OAuth authorization-code flow. The Identity Manager requests only Gmail scopes corresponding to approved `gmail:read` and `gmail:send` capabilities. Inbox responses contain message headers and redact code-like values; message bodies and access tokens are not returned to the UI.
- Secrets are kept out of agent prompts, database plaintext columns, and API responses. The server-side `CredentialVault` is backed by KMS envelopes and the ciphertext-only `agent_secret_envelopes` table.

## Production setup

1. Apply the repository migrations through the configured Supabase migration workflow. The RDIWI hardening migration is `supabase/migrations/20261021173247_rdiwi_runtime_hardening.sql`. It enables RLS, revokes broad role grants, adds organization-scoped policies and foreign keys, and creates secret-envelope, capability-request, and single-use OAuth-state tables. Review migration output before deployment; do not apply it from application startup.
2. Create a symmetric Google Cloud KMS key in a supported location. Grant the server workload identity `roles/cloudkms.cryptoKeyEncrypterDecrypter` on that key. Set `RUFFLO_KMS_KEY_NAME` to its full CryptoKey resource name and configure Application Default Credentials or workload identity. Do not ship a service-account JSON key with the application.
3. Enable the Gmail API and register an OAuth web client. Set `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, and `GOOGLE_WORKSPACE_DOMAIN`. The redirect URI must exactly equal `{APP_URL}/api/identity/google/callback` and be registered in Google Cloud. The connected account must belong to the configured Workspace domain.
4. Publish only the scopes the organization needs. Gmail read and send scopes are subject to Google OAuth consent, verification, and Workspace policy requirements. The implementation requests no account-creation scope and does not bypass provider restrictions.
5. Provide the production workload with Supabase server credentials and the KMS/OAuth settings above. `RUFFLO_SYSTEM_ORGANIZATION_ID` selects the organization used by the internal background research agent; tenant-triggered workforce creation uses the authenticated organization.

The corresponding variable names are listed in `.env.example`. Keep all values except the public client ID out of browser bundles; never prefix server secrets with `VITE_`.

## Verification

The focused tests are:

```powershell
npm.cmd exec -- tsx --test tests/kms-envelope-encryption.test.ts tests/digital-identity.test.ts
npm.cmd run typecheck
```

The Google and KMS integrations require real deployment configuration for an end-to-end OAuth and persistence check. Unit tests use an injected KMS client and do not contact Google Cloud or create external accounts.
