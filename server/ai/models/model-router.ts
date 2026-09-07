import { GoogleGenAI } from '@google/genai';
import { ModelProvider, ModelGenerateOptions, ModelGenerateResult, StreamCallback } from '../providers/model-provider.ts';
import { LocalProvider } from '../providers/local.provider.ts';
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

  private constructor() {
    this.initClient();
    this.initProviders();
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

  private initProviders(): void {
    this.providers.push(new OllamaProvider());
    this.providers.push(new GeminiProvider());
    this.providers.push(new LocalProvider());
  }

  public getClient(): GoogleGenAI | null {
    if (!this.client && process.env.GEMINI_API_KEY) {
      this.initClient();
    }
    return this.client;
  }

  public routeModel(taskType: 'coding' | 'reasoning' | 'creative' | 'general' | 'fast'): ModelRouteDecision {
    switch (taskType) {
      case 'coding':
        return {
          model: 'gemini-3.7-flash',
          reason: 'Selected for precise code synthesis, AST awareness, and error diagnosis',
          temperature: 0.1,
        };
      case 'reasoning':
        return {
          model: 'gemini-3.7-flash',
          reason: 'Selected for complex cross-agent planning and policy validation',
          temperature: 0.2,
        };
      case 'creative':
        return {
          model: 'gemini-3.7-flash',
          reason: 'Selected for nuanced social content, pitch creation, and branding',
          temperature: 0.7,
        };
      case 'fast':
      default:
        return {
          model: 'gemini-3.5-flash-lite',
          reason: 'High throughput, low-latency execution for heartbeat and log triage',
          temperature: 0.3,
        };
    }
  }

  public async executeWithFallback(prompt: string, systemInstruction?: string, taskType: 'coding' | 'reasoning' | 'creative' | 'general' | 'fast' = 'general'): Promise<string> {
    const client = this.getClient();
    if (!client) {
      try {
        const res = await this.generate({ prompt, systemInstruction, temperature: 0.3 });
        return res.text;
      } catch {
        return `[SIMULATED OFFLINE EXECUTION - GEMINI_API_KEY NOT CONFIGURED]\nProcessed prompt: ${prompt.slice(0, 100)}...`;
      }
    }

    const decision = this.routeModel(taskType);
    const candidateModels = [decision.model, 'gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

    let lastError: any = null;
    for (const model of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || 'You are an autonomous enterprise AI agent in the Rufflo Fleet.',
            temperature: decision.temperature,
          },
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[ModelRouter] Fallback from ${model} due to: ${err?.message || err}`);
      }
    }

    throw new Error(`All candidate AI models failed: ${lastError?.message || 'Unknown execution failure'}`);
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
    const modelScores: Record<string, number> = {
      'gemini-3.7-flash': 0.95,
      'gemini-3.5-flash-lite': 0.88,
    };
    const bestModel = Object.entries(modelScores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    return { model: bestModel, reason: 'Best routed model for this task category' };
  }
}

export const modelRouter = ModelRouter.getInstance();

