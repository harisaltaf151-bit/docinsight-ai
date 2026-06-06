/**
 * Embedding providers turn text into a fixed-dimension vector of floats.
 * We support two providers (OpenAI and Gemini) — Claude and Groq do not
 * expose a public embeddings API. Callers can pass whichever API key they
 * have; the document store records the model name so retrieval is rejected
 * if the query-time embeddings model differs.
 */

export type EmbeddingsProviderId = "openai" | "gemini";

export interface EmbeddingsModelInfo {
  id: string;
  label: string;
  dimensions: number;
}

export interface EmbeddingsProviderMeta {
  id: EmbeddingsProviderId;
  name: string;
  defaultModel: string;
  models: EmbeddingsModelInfo[];
}

export const EMBEDDINGS_META: Record<EmbeddingsProviderId, EmbeddingsProviderMeta> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    defaultModel: "text-embedding-3-small",
    models: [
      { id: "text-embedding-3-small", label: "Embedding 3 Small", dimensions: 1536 },
      { id: "text-embedding-3-large", label: "Embedding 3 Large", dimensions: 3072 },
      { id: "text-embedding-ada-002", label: "Ada 002 (legacy)", dimensions: 1536 },
    ],
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    defaultModel: "text-embedding-004",
    models: [
      { id: "text-embedding-004", label: "Embedding 004", dimensions: 768 },
      { id: "embedding-001", label: "Embedding 001 (legacy)", dimensions: 768 },
    ],
  },
};

export const EMBEDDINGS_PROVIDER_IDS = Object.keys(EMBEDDINGS_META) as EmbeddingsProviderId[];

export function resolveEmbeddingsModel(
  provider: EmbeddingsProviderId,
  model: string,
): EmbeddingsModelInfo {
  const meta = EMBEDDINGS_META[provider];
  const found = meta.models.find((m) => m.id === model);
  if (found) return found;
  // Unknown model — best-effort default so callers can still query with
  // a custom model id; the runtime will trust the response dimensions.
  return { id: meta.defaultModel, label: meta.defaultModel, dimensions: 0 };
}

export interface EmbeddingsProvider {
  readonly id: EmbeddingsProviderId;
  readonly model: string;
  /** Embed a batch of texts. Returns one vector per input, in order. */
  embed(texts: string[]): Promise<number[][]>;
}
