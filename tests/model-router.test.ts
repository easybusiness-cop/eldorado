import assert from "node:assert/strict";
import { test } from "node:test";
import { ModelRouter } from "../server/ai/models/model-router.ts";
import {
  ModelProvider,
  ModelProviderUnavailableError,
} from "../server/ai/providers/model-provider.ts";

const unavailableProvider: ModelProvider = {
  name: "unavailable-test-provider",
  isAvailable: () => false,
  generate: async () => {
    throw new Error("Unavailable providers must not be called.");
  },
};

test("model routing fails explicitly when no real provider is available", async () => {
  const router = new ModelRouter([unavailableProvider]);

  await assert.rejects(
    router.generate({ prompt: "Test request" }),
    (error: unknown) =>
      error instanceof ModelProviderUnavailableError &&
      error.code === "MODEL_PROVIDER_UNAVAILABLE",
  );
});

test("model routing returns only a response from an available provider", async () => {
  const provider: ModelProvider = {
    name: "verified-test-provider",
    isAvailable: () => true,
    generate: async () => ({
      text: "Provider-generated response",
      provider: "verified-test-provider",
      model: "test-model",
    }),
  };
  const router = new ModelRouter([provider]);

  const result = await router.generate({ prompt: "Test request" });

  assert.equal(result.text, "Provider-generated response");
  assert.equal(result.provider, "verified-test-provider");
});

test("streaming fails without emitting a success-shaped fallback", async () => {
  const router = new ModelRouter([unavailableProvider]);
  const chunks: string[] = [];

  await assert.rejects(
    router.generateStream({ prompt: "Test request" }, (chunk) => chunks.push(chunk.text)),
    (error: unknown) =>
      error instanceof ModelProviderUnavailableError &&
      error.code === "MODEL_PROVIDER_UNAVAILABLE",
  );
  assert.deepEqual(chunks, []);
});

test("task routing reports an available provider instead of a synthetic quality score", async () => {
  const provider: ModelProvider = {
    name: "ollama",
    isAvailable: () => true,
    generate: async () => ({
      text: "ok",
      provider: "ollama",
      model: "configured-local-model",
    }),
  };
  const router = new ModelRouter([provider]);

  const decision = await router.routeTask({ type: "coding" });

  assert.equal(decision.model, process.env.OLLAMA_MODEL || "llama3.2");
  assert.match(decision.reason, /no benchmark-based model ranking/i);
});
