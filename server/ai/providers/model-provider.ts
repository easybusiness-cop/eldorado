/**
 * Model Provider Abstraction (with streaming support)
 */

export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelGenerateOptions {
  messages?: ModelMessage[];
  prompt?: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseMimeType?: "text/plain" | "application/json";
}

export interface ModelGenerateResult {
  text: string;
  provider: string;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
  raw?: any;
}

/** Callback for streaming tokens */
export type StreamCallback = (chunk: {
  text: string;          // incremental token/text
  done: boolean;         // true on final chunk
  provider: string;
  model?: string;
}) => void;

export interface ModelProvider {
  readonly name: string;
  readonly isAvailable: () => boolean | Promise<boolean>;

  /** Non-streaming generation */
  generate(options: ModelGenerateOptions): Promise<ModelGenerateResult>;

  /** Optional streaming support */
  generateStream?(
    options: ModelGenerateOptions,
    onChunk: StreamCallback
  ): Promise<ModelGenerateResult>;
}
