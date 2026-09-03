import { GoogleGenAI } from '@google/genai';

export interface ModelRouteDecision {
  model: string;
  reason: string;
  temperature: number;
}

export class ModelRouter {
  private static instance: ModelRouter;
  private client: GoogleGenAI | null = null;

  private constructor() {
    this.initClient();
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
      return `[SIMULATED OFFLINE EXECUTION - GEMINI_API_KEY NOT CONFIGURED]\nProcessed prompt: ${prompt.slice(0, 100)}...`;
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
}

export const modelRouter = ModelRouter.getInstance();
