import { BaseAdapter, ToolExecutionContext } from "./base.adapter";

export class HttpAdapter extends BaseAdapter {
  get provider(): string {
    return "http_client";
  }

  // Gateway policies enforced on generic network access
  private allowedDomains: Set<string> = new Set([
    "api.github.com",
    "github.com",
    "api.stripe.com",
    "wikipedia.org",
    "internal-api.munderdifflin.com",
    "npmjs.com",
    "api.coingecko.com",
    "api.weather.gov"
  ]);

  private blockedDomains: Set<string> = new Set([
    "reddit.com",
    "twitter.com",
    "facebook.com",
    "attacker.com",
    "malicious-site.net"
  ]);

  public async execute(context: ToolExecutionContext): Promise<any> {
    const start = Date.now();
    const correlationId = context.correlationId || `corr-${Date.now()}`;
    const { action, parameters } = context;

    try {
      const urlString = parameters.url || "";
      if (!urlString) {
        throw new Error("HTTP Action missing parameter: 'url' is required.");
      }

      const url = new URL(urlString);
      const host = url.hostname.toLowerCase();

      // Enforce zero-trust network policies
      const isAllowed = Array.from(this.allowedDomains).some(domain => host === domain || host.endsWith("." + domain));
      const isBlocked = Array.from(this.blockedDomains).some(domain => host === domain || host.endsWith("." + domain));

      if (isBlocked || !isAllowed) {
        throw new Error(`Zero-Trust Violation: Network access to domain '${host}' is blocked under Organization security guidelines.`);
      }

      const method = (parameters.method || "GET").toUpperCase();
      const headers = parameters.headers || {};
      const body = parameters.body || null;
      const timeoutMs = parameters.timeout || 8000;

      // Clean/redact secret values from HTTP logs and parameters
      const redactedHeaders = this.redactHeaders(headers);

      // Perform simulated call with backoff & timeout handling
      const result = await this.performFetchWithBackoff(urlString, method, redactedHeaders, body, timeoutMs);

      return this.createResponse(true, action, result, null, Date.now() - start, correlationId, "LOW");
    } catch (err: any) {
      return this.createResponse(false, action, null, err.message, Date.now() - start, correlationId, "LOW");
    }
  }

  private redactHeaders(headers: Record<string, string>): Record<string, string> {
    const cleaned: Record<string, string> = {};
    const sensitiveKeys = ["authorization", "cookie", "x-api-key", "token", "password", "secret"];
    for (const [key, val] of Object.entries(headers)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        cleaned[key] = "[REDACTED_BY_SEC_GATEWAY]";
      } else {
        cleaned[key] = val;
      }
    }
    return cleaned;
  }

  private async performFetchWithBackoff(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    timeoutMs: number,
    retriesLeft = 2,
    delay = 500
  ): Promise<any> {
    try {
      // Create controller for timeout
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      // Build simulated response matching external environments
      await new Promise((resolve) => setTimeout(resolve, 150));
      clearTimeout(id);

      // Return a simulated, realistic response back payload based on URL path
      return {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        data: {
          url,
          method,
          timestamp: new Date().toISOString(),
          simulated: true,
          message: `Securely requested through Rufflo Tool Gateway HTTP adapter. Method: ${method}`
        }
      };
    } catch (err: any) {
      if (retriesLeft > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.performFetchWithBackoff(url, method, headers, body, timeoutMs, retriesLeft - 1, delay * 2);
      }
      throw err;
    }
  }
}
