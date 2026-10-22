# Engineering Agent Memory

Engineering agents retrieve organization-scoped memories before each real Mastra
runtime request. Retrieval combines memories for the individual agent, the
agent's department, and the organization. Retrieved text is reference material,
not instructions; agents must still verify it against the repository and task.

## Feeding memories

Send an authenticated `POST /api/agent/memory` request with JSON:

```json
{
  "agentId": "backend-engineer",
  "content": "Verified convention: run the memory-store test after changing memory retrieval.",
  "tags": ["testing", "verified"]
}
```

The request's authenticated organization determines the tenant. Do not include
an organization ID in the request body.

To share a fact or procedure with all agents in a registered department, use
department scope:

```json
{
  "scope": "department",
  "department": "engineering",
  "content": "Run the focused test for a change before running the full suite.",
  "tags": ["testing"]
}
```

Agent scope is the default and requires `agentId`. Department scope requires a
registered department; the service adds that department as a retrieval tag.
Only agent and department scopes can be written through this endpoint.

Store concise, durable knowledge: verified repository conventions, architectural
decisions with their rationale, or procedures that have worked. Include useful
tags to make memories easier to retrieve. Do not store credentials or treat a
model's claim of success as evidence.

## Verification boundary

Model responses from task and workflow endpoints are saved as `short_term`
records, not reusable agent memories. Existing memories tagged
`model-response`, `execution-unverified`, or `not-executed` are excluded from
agent prompt retrieval as well. A memory can be retrieved only within its
authenticated organization. Memory retrieval does not execute tools, modify
files, run tests, or verify task completion.
