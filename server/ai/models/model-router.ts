import { GoogleGenAI } from '@google/genai';
import { ModelProvider, ModelGenerateOptions, ModelGenerateResult, ModelProviderUnavailableError, StreamCallback } from '../providers/model-provider.ts';
import { GeminiProvider } from '../providers/gemini.provider.ts';
import { OllamaProvider } from '../providers/ollama.provider.ts';

export interface ModelRouteDecision {
  model: string;
  reason: string;
  temperature: number;
}

export class ModelRouter {
  private static instance: ModelRouter;
  private client: GoogleGenAI | null = null;
  private providers: ModelProvider[] = [];
  private preferLocal = true;

  public constructor(providers?: ModelProvider[]) {
    this.initClient();
    this.providers = providers ?? [new OllamaProvider(), new GeminiProvider()];
  }

  public static getInstance(): ModelRouter {
    if (!ModelRouter.instance) {
      ModelRouter.instance = new ModelRouter();
    }
    return ModelRouter.instance;
  }

  private initClient(): void {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'rufflo-agent-fleet-mastra',
          },
        },
      });
    }
  }

  public getClient(): GoogleGenAI | null {
    if (!this.client && process.env.GEMINI_API_KEY) {
      this.initClient();
    }
    return this.client;
  }

  public routeModel(taskType: 'coding' | 'reasoning' | 'creative' | 'general' | 'fast'): ModelRouteDecision {
    const temperatures = {
      coding: 0.1,
      reasoning: 0.2,
      creative: 0.7,
      general: 0.3,
      fast: 0.3,
    };
    return {
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      reason: `Configured Gemini model for ${taskType} tasks; no benchmark-based ranking is available.`,
      temperature: temperatures[taskType],
    };
  }

  public async executeWithFallback(prompt: string, systemInstruction?: string, taskType: 'coding' | 'reasoning' | 'creative' | 'general' | 'fast' = 'general'): Promise<string> {
    const decision = this.routeModel(taskType);
    const result = await this.generate({
      prompt,
      systemInstruction: systemInstruction || 'You are an enterprise AI agent.',
      temperature: decision.temperature,
    });
    return result.text;
  }

  // --- Provider flow methods ---
  public register(provider: ModelProvider) {
    this.providers.push(provider);
  }

  public async generate(options: ModelGenerateOptions): Promise<ModelGenerateResult> {
    const ordered = this.preferLocal ? this.providers : [...this.providers].reverse();
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

    if (lastError) {
      throw new Error("All available real model providers failed to generate a response.", { cause: lastError });
    }
    throw new ModelProviderUnavailableError();
  }

  public async generateStream(options: ModelGenerateOptions, onChunk: StreamCallback): Promise<ModelGenerateResult> {
    const ordered = this.preferLocal ? this.providers : [...this.providers].reverse();
    let lastError: any = null;

    for (const provider of ordered) {
      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        if (typeof provider.generateStream === "function") {
          return await provider.generateStream(options, onChunk);
        }

        const result = await provider.generate(options);
        if (result?.text) {
          onChunk({ text: result.text, done: false, provider: result.provider, model: result.model });
          onChunk({ text: "", done: true, provider: result.provider, model: result.model });
          return result;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[ModelRouter] Streaming provider "${provider.name}" failed:`, err.message);
      }
    }

    if (lastError) {
      throw new Error("All available real model providers failed to generate a response.", { cause: lastError });
    }
    throw new ModelProviderUnavailableError();
  }

  public async getStatus(): Promise<{ name: string; available: boolean }[]> {
    const status = [];
    for (const p of this.providers) {
      const available = await p.isAvailable();
      status.push({ name: p.name, available });
    }
    return status;
  }

  // --- MultiModelRouter compatibility ---
  public async routeTask(task: any) {
    void task;
    const availableProviders = (await this.getStatus()).filter((provider) => provider.available);
    if (availableProviders.length === 0) {
      throw new ModelProviderUnavailableError();
    }
    const selectedProvider = this.preferLocal
      ? availableProviders[0]
      : availableProviders[availableProviders.length - 1];
    const selectedModel = selectedProvider.name === 'ollama'
      ? process.env.OLLAMA_MODEL || 'llama3.2'
      : selectedProvider.name === 'gemini'
        ? process.env.GEMINI_MODEL || 'gemini-2.5-flash'
        : selectedProvider.name;
    return {
      model: selectedModel,
      reason: `Selected configured provider "${selectedProvider.name}" for this request; no benchmark-based model ranking is available.`,
    };
  }
}

export const modelRouter = ModelRouter.getInstance();
