import {
  ModelProvider,
  ModelGenerateOptions,
  ModelGenerateResult,
  StreamCallback,
} from "./model-provider";

/**
 * Ollama Provider – fully local models with streaming support
 */
export class OllamaProvider implements ModelProvider {
  readonly name = "ollama";

  private baseUrl: string;
  private defaultModel: string;
  private apiKey?: string;
  private timeoutMs: number;

  constructor(options?: {
    baseUrl?: string;
    defaultModel?: string;
    apiKey?: string;
    timeoutMs?: number;
  }) {
    this.baseUrl = (options?.baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
    this.defaultModel = options?.defaultModel || process.env.OLLAMA_MODEL || "llama3.2";
    this.apiKey = options?.apiKey || process.env.OLLAMA_API_KEY;
    this.timeoutMs = options?.timeoutMs || 180_000; // 3 minutes for longer streams
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Non-streaming generation */
  async generate(options: ModelGenerateOptions): Promise<ModelGenerateResult> {
    return this.generateStream(options, () => {});
  }

  /** Streaming generation */
  async generateStream(
    options: ModelGenerateOptions,
    onChunk: StreamCallback
  ): Promise<ModelGenerateResult> {
    const model = this.defaultModel;
    const system = options.systemInstruction || "";
    const prompt =
      options.prompt ||
      options.messages?.map((m) => `${m.role}: ${m.content}`).join("\n") ||
      "";

    const messages: { role: string; content: string }[] = [];

    if (system) {
      messages.push({ role: "system", content: system });
    }

    if (options.messages && options.messages.length > 0) {
      for (const m of options.messages) {
        messages.push({ role: m.role, content: m.content });
      }
    } else if (prompt) {
      messages.push({ role: "user", content: prompt });
    }

    if (messages.length === 0) {
      throw new Error("OllamaProvider: no prompt or messages provided");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages,
          stream: true, // <-- enable streaming
          options: {
            temperature: options.temperature ?? 0.3,
            num_predict: options.maxTokens ?? 2048,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Ollama API error ${response.status}: ${errText.slice(0, 200)}`);
      }

      if (!response.body) {
        throw new Error("Ollama returned no response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Ollama sends NDJSON (one JSON object per line)
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const data = JSON.parse(trimmed);
            const token = data?.message?.content || data?.response || "";

            if (token) {
              fullText += token;
              onChunk({
                text: token,
                done: false,
                provider: this.name,
                model,
              });
            }

            // Final message
            if (data?.done === true) {
              onChunk({
                text: "",
                done: true,
                provider: this.name,
                model,
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      clearTimeout(timer);

      // Flush any remaining buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer.trim());
          const token = data?.message?.content || data?.response || "";
          if (token) {
            fullText += token;
            onChunk({ text: token, done: false, provider: this.name, model });
          }
        } catch {
          // ignore
        }
      }

      // Ensure final done signal
      onChunk({
        text: "",
        done: true,
        provider: this.name,
        model,
      });

      if (!fullText.trim()) {
        throw new Error("Ollama stream returned empty content");
      }

      return {
        text: fullText.trim(),
        provider: this.name,
        model,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new Error(`Ollama stream timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.models || []).map((m: any) => m.name || m.model).filter(Boolean);
    } catch {
      return [];
    }
  }
}
