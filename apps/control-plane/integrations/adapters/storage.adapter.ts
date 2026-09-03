import { BaseAdapter, ToolExecutionContext } from "./base.adapter";

export class StorageAdapter extends BaseAdapter {
  get provider(): string {
    return "cloud_storage";
  }

  public async execute(context: ToolExecutionContext): Promise<any> {
    const start = Date.now();
    const correlationId = context.correlationId || `corr-${Date.now()}`;
    const { action, parameters } = context;

    try {
      const bucket = parameters.bucketName || "munderdifflin-records-prod";
      const key = parameters.fileKey || "";

      if (action !== "list" && !key) {
        throw new Error("Storage Adapter Error: Parameter 'fileKey' is required.");
      }

      // Enforce strict Multi-tenant isolation (prevent cross-tenant bucket manipulation)
      const tenantPrefix = context.organizationId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const belongsToTenant = bucket.startsWith(tenantPrefix) || bucket.includes("munderdifflin");

      if (!belongsToTenant) {
        throw new Error(`SECURITY VIOLATION: Access denied to bucket '${bucket}'. Multi-tenant guardrails forbid operations on other organizations' storage assets.`);
      }

      await new Promise((resolve) => setTimeout(resolve, 90)); // Simulation delay

      let data: any = {};

      switch (action) {
        case "upload":
          const content = parameters.content || "";
          data = {
            bucket,
            key,
            etag: `"${Math.floor(Math.random() * 1000000000)}"`,
            size: content.length,
            url: `https://storage.googleapis.com/${bucket}/${key}`,
            uploadedBy: context.agentId,
          };
          break;

        case "download":
          data = {
            bucket,
            key,
            content: `// Simulated content file download for ${key}\nexport const payload = "Munderdifflin Confidential Record Data";`,
            contentType: "application/javascript",
            size: 145
          };
          break;

        case "list":
          data = {
            bucket,
            files: [
              { key: "docs/architecture.md", size: 1024, lastModified: new Date().toISOString() },
              { key: "src/server.ts", size: 91400, lastModified: new Date().toISOString() },
              { key: "tests/app.test.ts", size: 4200, lastModified: new Date().toISOString() }
            ],
            count: 3
          };
          break;

        case "delete":
          data = {
            bucket,
            key,
            deleted: true,
            timestamp: new Date().toISOString(),
          };
          break;

        default:
          throw new Error(`Unsupported storage action: ${action}`);
      }

      return this.createResponse(true, action, data, null, Date.now() - start, correlationId, action === "delete" ? "HIGH" : "MEDIUM");
    } catch (err: any) {
      return this.createResponse(false, action, null, err.message, Date.now() - start, correlationId, "MEDIUM");
    }
  }
}
