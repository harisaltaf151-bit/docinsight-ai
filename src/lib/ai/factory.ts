import type { ProviderId } from "@/types/provider";
import type { AIProvider } from "./provider";
import { ClaudeProvider } from "./claude";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";

/**
 * Construct an AIProvider instance for the requested provider id.
 *
 * Each implementation is a thin adapter over the vendor SDK so the rest of
 * the codebase never imports SDK-specific code.
 */
export function createProvider(
  id: ProviderId,
  apiKey: string,
  model: string,
): AIProvider {
  switch (id) {
    case "claude":
      return new ClaudeProvider(apiKey, model);
    case "openai":
      return new OpenAIProvider(apiKey, model);
    case "gemini":
      return new GeminiProvider(apiKey, model);
    case "groq":
      return new GroqProvider(apiKey, model);
    default: {
      const exhaustive: never = id;
      throw new Error(`Unsupported provider: ${String(exhaustive)}`);
    }
  }
}
