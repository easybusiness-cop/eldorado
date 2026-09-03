# ⚙️ Universal Tool Gateway Specifications

The **Tool Gateway** serves as the single point of ingress and egress for all agent external operations.

## Universal Contract Schema

All operations executed through the gateway are strictly wrapped in the following standard output schema:

```json
{
  "executionId": "exec-1612345678-431",
  "success": true,
  "tool": "github",
  "action": "create_pull_request",
  "data": {
    "prNumber": 142,
    "status": "open",
    "url": "https://github.com/munderdifflin/company-os/pull/142"
  },
  "error": null,
  "metadata": {
    "durationMs": 142,
    "provider": "github",
    "correlationId": "corr-exec-1612345678-431"
  }
}
```

## Step-by-Step Gate Pipeline

1. **Authenticate caller**: Ensure organization identification parameters are valid.
2. **Identify employee role & capabilities**: Check capability registrations (least privilege).
3. **Calculate risk levels**: Evaluate through the `RiskCalculator`.
4. **Evaluate corporate policy**: Evaluate through the `PolicyEngine`.
5. **Approval checks**: Halt execution if `CRITICAL` risk is reached or policy triggers approval.
6. **Launch Adapter**: Forward parameters to safe adapters (Database, GitHub, HTTP).
7. **Redact logs & Return results**: Redact secrets using `SecretService.redact`.
