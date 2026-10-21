import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export interface CallGeminiOptions {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  preferredModel?: string;
}

// Retry the configured model once for transient service or quota failures.
export async function callGeminiResilient(options: CallGeminiOptions): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = options.preferredModel || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  let lastError: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const config: any = {};
      if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
      if (options.temperature !== undefined) config.temperature = options.temperature;
      if (options.responseMimeType) config.responseMimeType = options.responseMimeType;

      const response = await client.models.generateContent({
        model,
        contents: options.contents,
        config,
      });

      if (response && typeof response.text === "string" && response.text.trim()) {
        return response.text;
      }
      throw new Error(`Gemini model "${model}" returned an empty response.`);
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isTemporary =
        errMsg.includes("503") ||
        errMsg.includes("429") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("resource_exhausted") ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.includes("high demand") ||
        errMsg.includes("fetch failed");

      if (isTemporary && attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      break;
    }
  }

  const lastMsg =
    lastError?.message || "";

  const isQuotaError =
    lastMsg.includes("resource_exhausted") ||
    lastMsg.includes("QUOTA_EXCEEDED") ||
    lastMsg.includes("429") ||
    lastMsg.toLowerCase().includes("quota");

  if (isQuotaError) {
    throw new Error(
      "Gemini quota/rate limit exceeded. " +
      "Autonomous execution was stopped because Rufflo cannot " +
      "claim successful code generation without a verified model result.",
    );
  }

  throw lastError || new Error(`Gemini model "${model}" is unavailable.`);
}
