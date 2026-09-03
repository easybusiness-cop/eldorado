import { Router, Request, Response } from "express";
import { WebhookSecurity } from "./webhook.security";
import { WebhookService } from "./webhook.service";

const router = Router();

router.post("/api/webhooks/:source", (req: Request, res: Response) => {
  try {
    const { source } = req.params;
    const signature = req.headers["x-signature"] as string || "";
    const webhookSecret = process.env.WEBHOOK_SECRET || "whsec_default_munder_sig";

    // Validate Signature
    const rawBody = JSON.stringify(req.body);
    const signatureCheck = WebhookSecurity.verifySignature(rawBody, signature, webhookSecret);

    if (!signatureCheck.valid) {
      return res.status(401).json({
        success: false,
        error: `Unauthorized Webhook Signature: ${signatureCheck.error}`
      });
    }

    const eventId = req.headers["x-event-id"] as string || `wh-evt-${Date.now()}`;

    const ingestResult = WebhookService.handleIncomingWebhook({
      id: eventId,
      source: source as any,
      eventType: req.body.action || "received",
      payload: req.body,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      eventId: ingestResult.eventId,
      isDuplicate: ingestResult.isDuplicate,
      status: "Ingested and piped to corporate Event Bus"
    });

  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { router as webhookRouter };
