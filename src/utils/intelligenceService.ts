/**
 * Client-side access to the configured model response endpoint.
 */

import { recommendationService, RecommendedItem } from './recommendationService';

export interface IntelligenceMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  tools?: string[];
  telemetry?: {
    action?: string;
    status?: string;
    engine?: string;
  };
}

export interface IntelligenceModel {
  id: string;
  name: string;
  provider: 'Google Gemini' | 'Rufflo Quantum' | 'Anthropic' | 'OpenAI';
  contextWindow: number;
  description: string;
  badge: string;
  isDefault?: boolean;
}

export interface IntelligenceStreamOptions {
  prompt: string;
  messages?: IntelligenceMessage[];
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  useBrowser?: boolean;
  onToken?: (token: string) => void;
  onStepStart?: (step: { role: string; objective: string; tool?: string }) => void;
  onStepComplete?: (step: { role: string; tool?: string; output?: any }) => void;
  onError?: (error: Error) => void;
  onComplete?: (fullText: string) => void;
}

export const QUANTUM_MODELS: IntelligenceModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google Gemini',
    contextWindow: 1048576,
    description: 'Fast, highly capable multimodal reasoning and autonomous tool execution.',
    badge: 'Default',
    isDefault: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google Gemini',
    contextWindow: 2097152,
    description: 'State-of-the-art complex software architecture and recursive multi-agent planning.',
    badge: 'Deep Reasoning',
  },
  {
    id: 'rufflo-quantum-v2',
    name: 'Rufflo Quantum Engine',
    provider: 'Rufflo Quantum',
    contextWindow: 256000,
    description: 'Autonomous company operating system meta-orchestrator with full tool calling.',
    badge: 'Autonomous Fleet',
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    description: 'Hybrid reasoning and code engineering intelligence.',
    badge: 'Coding Specialist',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o Omnimodal',
    provider: 'OpenAI',
    contextWindow: 128000,
    description: 'Omni intelligence for high-throughput enterprise tasks.',
    badge: 'Versatile',
  },
];

class QuantumIntelligenceService {
  private static instance: QuantumIntelligenceService;
  private currentModel: string = 'gemini-2.5-flash';
  private connectionStatus: 'connected' | 'connecting' | 'idle' | 'error' = 'idle';

  private constructor() {}

  public static getInstance(): QuantumIntelligenceService {
    if (!QuantumIntelligenceService.instance) {
      QuantumIntelligenceService.instance = new QuantumIntelligenceService();
    }
    return QuantumIntelligenceService.instance;
  }

  public getCurrentModel(): string {
    return this.currentModel;
  }

  public setCurrentModel(modelId: string): void {
    this.currentModel = modelId;
  }

  public getModels(): IntelligenceModel[] {
    return QUANTUM_MODELS;
  }

  public getConnectionStatus(): 'connected' | 'connecting' | 'idle' | 'error' {
    return this.connectionStatus;
  }

  /**
   * Test live connection to Orchestrator backend
   */
  public async testConnection(): Promise<{ ok: boolean; message: string; activeEngine: string }> {
    this.connectionStatus = 'connecting';
    try {
      const res = await fetch('/api/orchestrator/state', { method: 'GET' });
      if (res.ok) {
        this.connectionStatus = 'connected';
        return {
          ok: true,
          message: 'Rufflo Quantum Orchestrator Engine connected',
          activeEngine: this.currentModel,
        };
      }
    } catch {
      // Ignore
    }

    try {
      const res = await fetch('/api/health', { method: 'GET' });
      if (res.ok) {
        this.connectionStatus = 'connected';
        return {
          ok: true,
          message: 'Rufflo Autonomous Company backend active',
          activeEngine: 'Rufflo Quantum Kernel',
        };
      }
    } catch (err: any) {
      this.connectionStatus = 'error';
      return {
        ok: false,
        message: err?.message || 'Failed to connect to backend',
        activeEngine: 'Offline',
      };
    }

    return {
      ok: false,
      message: 'Service unavailable',
      activeEngine: 'Offline',
    };
  }

  /**
   * Stream response from Orchestrator / Gemini pipeline
   */
  public async streamResponse(options: IntelligenceStreamOptions): Promise<string> {
    const {
      prompt,
      messages = [],
      model,
      onToken,
      onStepStart,
      onStepComplete,
      onError,
      onComplete,
    } = options;

    let fullAccumulatedText = '';

    try {
      onStepStart?.({
        role: 'orchestrator',
        objective: 'Requesting a response from the configured backend model provider...',
        tool: 'configured-provider',
      });

      const response = await fetch('/api/orchestrator/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          prompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          ...(model ? { model } : {}),
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Model request failed (${response.status}): ${details || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream available in response.');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') break;

            let parsed: any;
            try {
              parsed = JSON.parse(dataStr);
            } catch (error) {
              throw new Error(`Model stream returned invalid event data: ${error instanceof Error ? error.message : String(error)}`);
            }

            if (parsed.type === 'token' && parsed.content) {
              fullAccumulatedText += parsed.content;
              onToken?.(parsed.content);
            } else if (parsed.type === 'step_start') {
              onStepStart?.(parsed);
            } else if (parsed.type === 'step_complete') {
              onStepComplete?.(parsed);
            } else if (parsed.type === 'complete' && parsed.content) {
              fullAccumulatedText = parsed.content;
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message || 'Model stream processing failed.');
            }
          }
        }
      }

      if (!fullAccumulatedText.trim()) {
        throw new Error('The configured model provider returned no response content.');
      }

      onComplete?.(fullAccumulatedText);
      return fullAccumulatedText;
    } catch (error) {
      const surfacedError = error instanceof Error ? error : new Error(String(error));
      onError?.(surfacedError);
      throw surfacedError;
    }
  }
}

export const intelligenceService = QuantumIntelligenceService.getInstance();
