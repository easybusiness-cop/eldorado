import { BaseAdapter, ToolExecutionContext } from "./base.adapter";

export class WebhookAdapter extends BaseAdapter {
  get provider(): string {
    return "webhook_sender";
  }

  public async execute(context: ToolExecutionContext): Promise<any> {
    const start = Date.now();
    const correlationId = context.correlationId || `corr-${Date.now()}`;
    const { action, parameters } = context;

    try {
      const destination = parameters.targetUrl || "";
      if (!destination) {
        throw new Error("Webhook Error: 'targetUrl' is required.");
      }

      const payload = parameters.payload || {};
      const signatureSecret = parameters.secret || "whsec_default_munder_sig";

      // Simulated signing verification header
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = `t=${timestamp},v1=simulated_sha256_hash_signature_${timestamp}`;

      await new Promise((resolve) => setTimeout(resolve, 100)); // Latency delay

      const deliveryReport = {
        delivered: true,
        statusCode: 200,
        destination,
        timestamp,
        signatureUsed: signature.slice(0, 20) + "...",
        payloadSize: JSON.stringify(payload).length,
      };

      return this.createResponse(true, action, deliveryReport, null, Date.now() - start, correlationId, "MEDIUM");
    } catch (err: any) {
      return this.createResponse(false, action, null, err.message, Date.now() - start, correlationId, "MEDIUM");
    }
  }
}
