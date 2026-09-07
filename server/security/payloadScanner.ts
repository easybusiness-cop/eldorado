import { Request, Response, NextFunction } from "express";
import { SecurityAuditLedger } from "./auditLedger.ts";

// Lightweight OWASP ZAP/WAF Signature Rules for automated request payload scanning
const SECURITY_SIGNATURES = [
  {
    name: "Cross-Site Scripting (XSS)",
    pattern: /<script\b[^>]*>|javascript:|onload\s*=|<iframe\b[^>]*>|onerror\s*=/i,
    severity: "HIGH" as const,
  },
  {
    name: "SQL Injection (SQLi)",
    pattern: /UNION\s+ALL\s+SELECT|UNION\s+SELECT|' OR '1'='1|' OR 1=1|'\s*OR\s*'\d+'\s*=\s*'\d+|\bDROP\s+TABLE\b|\bINSERT\s+INTO\b/i,
    severity: "CRITICAL" as const,
  },
  {
    name: "Path Traversal (LFI/RFI)",
    pattern: /\.\.\/\.\.\/|\.\.\\\.\.\\|%2e%2e%2f|etc\/passwd|boot\.ini/i,
    severity: "HIGH" as const,
  },
  {
    name: "OS Command Injection",
    pattern: /;\s*cat\s+\/etc|;\s*rm\s+-rf|\|\|\s*bash\b|&&\s*sh\b/i,
    severity: "CRITICAL" as const,
  },
  {
    name: "XML External Entity (XXE)",
    pattern: /<!ENTITY\s+.*\s+(SYSTEM|PUBLIC)\s+/i,
    severity: "CRITICAL" as const,
  }
];

/**
 * Recursively scans any string values inside an object/array/value for malicious patterns.
 * Returns the names of any flagged threat signatures.
 */
function scanValue(val: any, flagged: Set<string>): void {
  if (!val) return;

  if (typeof val === "string") {
    for (const rule of SECURITY_SIGNATURES) {
      if (rule.pattern.test(val)) {
        flagged.add(`${rule.name} (Severity: ${rule.severity})`);
      }
    }
  } else if (Array.isArray(val)) {
    for (const item of val) {
      scanValue(item, flagged);
    }
  } else if (typeof val === "object") {
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        // Also scan the keys themselves to prevent malicious object-key injection
        scanValue(key, flagged);
        scanValue(val[key], flagged);
      }
    }
  }
}

/**
 * Express Middleware Hook to perform lightweight OWASP ZAP-like automated payload scanning.
 */
export function payloadScannerMiddleware(req: Request, res: Response, next: NextFunction) {
  // We skip scanning for GET requests without query parameters to maximize throughput
  if (req.method === "GET" && Object.keys(req.query).length === 0) {
    return next();
  }

  // Certain administrative endpoints can opt-out if they explicitly run code or custom SQL
  // (e.g. testing suite, executed tool gateway queries if requested by admin)
  const isExcludedEndpoint = 
    req.path.includes("/security/test-suite") || 
    req.path.includes("/tools/execute") ||
    req.path.includes("/execute-code") ||
    req.path.includes("/code/execute");

  if (isExcludedEndpoint) {
    return next();
  }

  const flaggedThreats = new Set<string>();

  // Scan query parameters, request body, headers, and route parameters
  scanValue(req.query, flaggedThreats);
  scanValue(req.body, flaggedThreats);
  scanValue(req.params, flaggedThreats);

  // Scan specific custom headers (avoiding general standard user-agent/cookie noise)
  if (req.headers["x-custom-action"] || req.headers["x-agent-id"]) {
    scanValue(req.headers["x-custom-action"], flaggedThreats);
    scanValue(req.headers["x-agent-id"], flaggedThreats);
  }

  if (flaggedThreats.size > 0) {
    const findings = Array.from(flaggedThreats);
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
    
    // Determine the highest risk score based on flagged severities
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let riskScore = 10;

    if (findings.some(f => f.includes("CRITICAL"))) {
      riskLevel = "CRITICAL";
      riskScore = 95;
    } else if (findings.some(f => f.includes("HIGH"))) {
      riskLevel = "HIGH";
      riskScore = 75;
    }

    // Log the blocked intrusion attempt securely to the corporate audit ledger
    SecurityAuditLedger.log({
      actor: (req as any).identity?.userId || "anonymous-intruder",
      tenant: (req as any).identity?.organizationId || "org-unknown",
      action: "API_PAYLOAD_OWASP_BLOCKED",
      resource: req.originalUrl || req.path,
      policyDecision: "deny",
      riskScore,
      riskLevel,
      findings: [
        `Blocked request from IP ${clientIp} due to OWASP payload detection.`,
        ...findings
      ],
      isolationLevel: "WAF_PAYLOAD_SCANNER",
      networkIsolated: true,
      credentialsStripped: true
    });

    return res.status(403).json({
      success: false,
      error: "Security Policy Violation: Malicious payload signature detected.",
      findings,
      timestamp: new Date().toISOString(),
    });
  }

  next();
}
