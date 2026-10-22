import type { ModelGenerateOptions, ModelGenerateResult } from "../providers/model-provider.ts";

type LangfuseRuntime = {
  sdk: import("@opentelemetry/sdk-node").NodeSDK;
  processor: import("@langfuse/otel").LangfuseSpanProcessor;
  startActiveObservation: typeof import("@langfuse/tracing").startActiveObservation;
};

let runtimePromise: Promise<LangfuseRuntime | null> | undefined;
let runtime: LangfuseRuntime | undefined;
let missingCredentialsWarned = false;
let setupFailureWarned = false;

function isTracingEnabled(): boolean {
  return process.env.LANGFUSE_TRACING_ENABLED?.toLowerCase() === "true";
}

function shouldCaptureContent(): boolean {
  return process.env.LANGFUSE_CAPTURE_CONTENT?.toLowerCase() === "true";
}

async function initializeLangfuse(): Promise<LangfuseRuntime | null> {
  if (!isTracingEnabled()) return null;

  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    if (!missingCredentialsWarned) {
      console.warn("[Langfuse] Tracing was enabled, but Langfuse credentials are not configured.");
      missingCredentialsWarned = true;
    }
    return null;
  }

  if (runtime) return runtime;
  if (runtimePromise) return runtimePromise;

  runtimePromise = (async () => {
    try {
      const [{ NodeSDK }, { LangfuseSpanProcessor }, { startActiveObservation }] = await Promise.all([
        import("@opentelemetry/sdk-node"),
        import("@langfuse/otel"),
        import("@langfuse/tracing"),
      ]);

      const processor = new LangfuseSpanProcessor();
      const sdk = new NodeSDK({ spanProcessors: [processor] });
      sdk.start();

      runtime = { sdk, processor, startActiveObservation };
      return runtime;
    } catch {
      if (!setupFailureWarned) {
        console.warn("[Langfuse] Tracing could not be initialized; model generation will continue without tracing.");
        setupFailureWarned = true;
      }
      return null;
    }
  })();

  return runtimePromise;
}

function getCapturedInput(
  options: ModelGenerateOptions,
): Record<string, string> | Array<{ role: string; content: string }> {
  if (options.messages?.length) {
    return options.messages.map(({ role, content }) => ({ role, content }));
  }

  return {
    ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
    ...(options.prompt ? { prompt: options.prompt } : {}),
  };
}

/**
 * Adds an optional Langfuse generation observation around a provider call.
 * Tracing is opt-in, and request/response content is excluded unless the
 * separate LANGFUSE_CAPTURE_CONTENT consent flag is explicitly enabled.
 */
export async function withLangfuseModelGeneration<T extends ModelGenerateResult>(
  provider: string,
  options: ModelGenerateOptions,
  generate: () => Promise<T>,
): Promise<T> {
  if (!isTracingEnabled()) return generate();

  const langfuse = await initializeLangfuse();
  if (!langfuse) return generate();

  const captureContent = shouldCaptureContent();
  let operationFailed = false;
  let operationError: unknown;
  let operationCompleted = false;
  let operationResult: T | undefined;

  try {
    return await langfuse.startActiveObservation(
      "model-provider-generation",
      async (observation) => {
        try {
          const result = await generate();
          operationCompleted = true;
          operationResult = result;

          const metadata: Record<string, string | boolean> = {
            provider,
            contentCaptured: captureContent,
          };
          const update: Parameters<typeof observation.update>[0] = { metadata };
          if (result.model) update.model = result.model;
          if (captureContent) {
            update.input = getCapturedInput(options);
            update.output = result.text;
          }
          if (result.usage) {
            const usageDetails: Record<string, number> = {};
            if (typeof result.usage.promptTokens === "number") usageDetails.input = result.usage.promptTokens;
            if (typeof result.usage.completionTokens === "number") usageDetails.output = result.usage.completionTokens;
            if (Object.keys(usageDetails).length > 0) update.usageDetails = usageDetails;
          }

          try {
            observation.update(update);
          } catch {
            // An export/SDK issue must never turn a successful provider call into a failure.
          }
          return result;
        } catch (error) {
          operationFailed = true;
          operationError = error;
          try {
            observation.update({
              level: "ERROR",
              statusMessage: "Model provider request failed",
              metadata: { provider, contentCaptured: captureContent },
            });
          } catch {
            // Keep provider errors and fallback behavior independent of telemetry.
          }
          throw error;
        }
      },
      { asType: "generation" },
    );
  } catch (error) {
    if (operationFailed) throw operationError;
    if (operationCompleted) return operationResult as T;

    // If telemetry setup failed before invoking the callback, run the provider once without tracing.
    if (!setupFailureWarned) {
      console.warn("[Langfuse] A tracing error occurred before the provider call; continuing without tracing.");
      setupFailureWarned = true;
    }
    return generate();
  }
}

/** Flush telemetry during graceful server shutdown when the host supports it. */
export async function shutdownLangfuseTracing(): Promise<void> {
  const activeRuntime = runtime;
  if (!activeRuntime) return;

  try {
    await activeRuntime.processor.forceFlush();
    await activeRuntime.sdk.shutdown();
  } catch {
    if (!setupFailureWarned) {
      console.warn("[Langfuse] Tracing could not flush cleanly during shutdown.");
      setupFailureWarned = true;
    }
  }
}
