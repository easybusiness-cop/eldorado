import { ModelProvider, ModelGenerateOptions, ModelGenerateResult } from "./model-provider";
import { callGeminiResilient, getGeminiClient } from "../geminiService";

/**
 * Optional Gemini provider.
 * Only used when GEMINI_API_KEY is present and the router chooses it.
 */
export class GeminiProvider implements ModelProvider {
  readonly name = "gemini";

  isAvailable(): boolean {
    return !!getGeminiClient();
  }

  async generate(options: ModelGenerateOptions): Promise<ModelGenerateResult> {
    if (!this.isAvailable()) {
      throw new Error("Gemini provider is not available (missing API key)");
    }

    const text = await callGeminiResilient({
      contents: options.prompt || options.messages?.map((m) => m.content).join("\n") || "",
      systemInstruction: options.systemInstruction,
      temperature: options.temperature ?? 0.3,
      responseMimeType: options.responseMimeType,
    });

    return {
      text,
      provider: this.name,
      model: "gemini",
    };
  }
}
