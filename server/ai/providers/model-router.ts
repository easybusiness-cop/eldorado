import { ModelProvider, ModelGenerateOptions, ModelGenerateResult, StreamCallback } from "./model-provider";
import { LocalProvider } from "./local.provider";
import { GeminiProvider } from "./gemini.provider";
import { OllamaProvider } from "./ollama.provider";

/**
 * Model Router – Rufflo decides which brain to use.
 *
 * Priority (independence first):
 * 1. Ollama (local models) – if running
 * 2. LocalProvider (rule-based, always works)
 * 3. Gemini (optional cloud)
 */
export class ModelRouter {
  private providers: ModelProvider[] = [];
  private preferLocal: boolean;

  constructor(options?: { preferLocal?: boolean }) {
    this.preferLocal = options?.preferLocal ?? true;

    // 1. Ollama (real local LLM)
    const ollama = new OllamaProvider();
    this.providers.push(ollama);

    // 2. Always-available rule-based local
    this.providers.push(new LocalProvider());

    // 3. Optional Gemini
    const gemini = new GeminiProvider();
    this.providers.push(gemini);
  }

  /** Register any future provider */
  register(provider: ModelProvider) {
    this.providers.push(provider);
  }

  async generate(options: ModelGenerateOptions): Promise<ModelGenerateResult> {
    // Order: prefer local brains first
    const ordered = this.preferLocal
      ? this.providers
      : [...this.providers].reverse();

    let lastError: any = null;

    for (const provider of ordered) {
      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        const result = await provider.generate(options);
        if (result?.text && result.text.trim().length > 0) {
          return result;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[ModelRouter] Provider "${provider.name}" failed:`, err.message);
      }
    }

    // Absolute last resort
    return {
      text: JSON.stringify({
        error: "All model providers failed",
        fallback: true,
        message: "Rufflo emergency local response",
        detail: lastError?.message || "unknown",
      }, null, 2),
      provider: "emergency-local",
    };
  }

  /**
   * Streaming generation – tries providers in priority order
   */
  async generateStream(
    options: ModelGenerateOptions,
    onChunk: StreamCallback
  ): Promise<ModelGenerateResult> {
    const ordered = this.preferLocal
      ? this.providers
      : [...this.providers].reverse();

    let lastError: any = null;

    for (const provider of ordered) {
      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        // Prefer native streaming if the provider supports it
        if (typeof provider.generateStream === "function") {
          return await provider.generateStream(options, onChunk);
        }

        // Fallback: non-streaming provider → emit as single chunk
        const result = await provider.generate(options);
        if (result?.text) {
          onChunk({
            text: result.text,
            done: false,
            provider: result.provider,
            model: result.model,
          });
          onChunk({
            text: "",
            done: true,
            provider: result.provider,
            model: result.model,
          });
          return result;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[ModelRouter] Streaming provider "${provider.name}" failed:`, err.message);
      }
    }

    // Emergency fallback
    const emergencyText = JSON.stringify({
      error: "All streaming providers failed",
      fallback: true,
      detail: lastError?.message || "unknown",
    });

    onChunk({ text: emergencyText, done: false, provider: "emergency-local" });
    onChunk({ text: "", done: true, provider: "emergency-local" });

    return {
      text: emergencyText,
      provider: "emergency-local",
    };
  }

  /** Debug helper – see which providers are currently available */
  async getStatus(): Promise<{ name: string; available: boolean }[]> {
    const status = [];
    for (const p of this.providers) {
      const available = await p.isAvailable();
      status.push({ name: p.name, available });
    }
    return status;
  }
}

// Singleton used across the whole OS
export const modelRouter = new ModelRouter({ preferLocal: true });
