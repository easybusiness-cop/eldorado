// Unified Enterprise Integration Tests for Command 03

import { ToolGateway } from "../apps/control-plane/integrations/gateway/tool.gateway";
import { RiskCalculator } from "../risk-engine/risk.calculator";
import { PolicyEngine } from "../apps/control-plane/integrations/gateway/policy.middleware";
import { SecretService } from "../secrets/secret.service";
import { WebhookSecurity } from "../webhooks/webhook.security";

export async function runSecurityTestSuite(): Promise<{
  passed: boolean;
  results: { name: string; success: boolean; details: string }[];
}> {
  const gateway = new ToolGateway();
  const results: { name: string; success: boolean; details: string }[] = [];

  // 1. TEST: Risk Calculator Engine
  try {
    const calculation = RiskCalculator.calculate("github", "merge_pull_request", {}, "development");
    const success = calculation.riskLevel === "HIGH" && calculation.approvalRequired;
    results.push({
      name: "Risk Evaluation Engine: HIGH action",
      success,
      details: success ? "Successfully evaluated base rule git.merge to HIGH risk with required approval." : `Mismatch: Evaluated: ${calculation.riskLevel}`
    });
  } catch (err: any) {
    results.push({ name: "Risk Evaluation Engine: HIGH action", success: false, details: err.message });
  }

  // 2. TEST: Destructive Action Risk Elevation
  try {
    const calculation = RiskCalculator.calculate("postgresql", "alter_schema", {}, "development");
    const success = calculation.riskLevel === "CRITICAL" && calculation.approvalRequired;
    results.push({
      name: "Risk Evaluation Engine: Destructive alter action",
      success,
      details: success ? "Correctly elevated destructive alter action to CRITICAL, triggers human approval." : `Mismatch: Evaluated: ${calculation.riskLevel}`
    });
  } catch (err: any) {
    results.push({ name: "Risk Evaluation Engine: Destructive alter action", success: false, details: err.message });
  }

  // 3. TEST: Spending Threshold Enforcement
  try {
    const calculation = RiskCalculator.calculate("stripe", "create_invoice", { amount: 650 }, "development");
    const success = calculation.riskLevel === "CRITICAL" && calculation.approvalRequired;
    results.push({
      name: "Risk Evaluation Engine: Financial limit violation",
      success,
      details: success ? "Successfully flagged invoice for $650 (> $500 cap) as CRITICAL risk." : `Mismatch: Evaluated: ${calculation.riskLevel}`
    });
  } catch (err: any) {
    results.push({ name: "Risk Evaluation Engine: Financial limit violation", success: false, details: err.message });
  }

  // 4. TEST: Enterprise Policy Engine Blocked
  try {
    const evaluation = PolicyEngine.evaluate({
      tool: "postgresql",
      action: "update",
      role: "specialist",
      department: "Engineering",
      environment: "production",
      parameters: {}
    });
    const success = !evaluation.allowed && evaluation.reason.includes("explicitly forbids");
    results.push({
      name: "Policy Evaluation Engine: Enforces environment restriction",
      success,
      details: success ? "Correctly blocked postgresql.update write attempts in production env." : `Mismatch: allowed=${evaluation.allowed}`
    });
  } catch (err: any) {
    results.push({ name: "Policy Evaluation Engine: Enforces environment restriction", success: false, details: err.message });
  }

  // 5. TEST: Multi-tenant tenant-A vs tenant-B isolation
  try {
    const execution = await gateway.execute({
      agentId: "pete",
      organizationId: "org-compromised-tenant-b", // Intruder tenant
      tool: "github",
      action: "list_repositories",
      parameters: {},
    });
    const success = !execution.success && execution.error?.includes("Multi-Tenant Security Error");
    results.push({
      name: "Multi-Tenant Isolation Guard: Restricts foreign organization",
      success,
      details: success ? "Successfully isolated and blocked cross-tenant access request." : `Failed: Bypass occurred.`
    });
  } catch (err: any) {
    results.push({ name: "Multi-Tenant Isolation Guard: Restricts foreign organization", success: false, details: err.message });
  }

  // 6. TEST: Secret Redaction
  try {
    const rawLog = "Error establishing connection. Token used: ghp_securetoken3819238918239128381923 and private key password=MySuperPass123";
    const redacted = SecretService.redact(rawLog);
    const success = !redacted.includes("ghp_") && !redacted.includes("MySuperPass123") && redacted.includes("[REDACTED_SECURITY_GATEWAY]");
    results.push({
      name: "Credential & Key Redactor: Cleans sensitive secrets",
      success,
      details: success ? "Successfully detected and redacted GitHub tokens and DB passwords from log outputs." : `Failed: Raw logs leaked: ${redacted}`
    });
  } catch (err: any) {
    results.push({ name: "Credential & Key Redactor: Cleans sensitive secrets", success: false, details: err.message });
  }

  // 7. TEST: Webhook signature verify and replay preventer
  try {
    const secret = "whsec_secure_key";
    const payload = JSON.stringify({ action: "push" });
    const timestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago (Expired)
    const sigHeader = `t=${timestamp},v1=somehash`;

    const check = WebhookSecurity.verifySignature(payload, sigHeader, secret);
    const success = !check.valid && check.error?.includes("expired");
    results.push({
      name: "Webhook Replay Attack Guard: Detects expired payloads",
      success,
      details: success ? "Successfully blocked simulated webhook replay trigger expired past 5m." : `Failed: Bypass occurred.`
    });
  } catch (err: any) {
    results.push({ name: "Webhook Replay Attack Guard: Detects expired payloads", success: false, details: err.message });
  }

  const passed = results.every(r => r.success);
  return { passed, results };
}
