import type { EmbeddingsProvider, EmbeddingsProviderId } from "./embeddings";
import { OpenAIEmbeddingsProvider } from "./openai-embeddings";
import { GeminiEmbeddingsProvider } from "./gemini-embeddings";

export function createEmbeddingsProvider(
  id: EmbeddingsProviderId,
  apiKey: string,
  model: string,
): EmbeddingsProvider {
  switch (id) {
    case "openai":
      return new OpenAIEmbeddingsProvider(apiKey, model);
    case "gemini":
      return new GeminiEmbeddingsProvider(apiKey, model);
    default: {
      const exhaustive: never = id;
      throw new Error(`Unsupported embeddings provider: ${String(exhaustive)}`);
    }
  }
}
