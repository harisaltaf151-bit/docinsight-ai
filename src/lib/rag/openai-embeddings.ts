import OpenAI from "openai";
import type { EmbeddingsProvider } from "./embeddings";

/**
 * OpenAI embeddings provider. Uses the official SDK. Each request can
 * carry up to 2048 inputs; we batch defensively at 256 to keep request
 * bodies small.
 */
export class OpenAIEmbeddingsProvider implements EmbeddingsProvider {
  readonly id = "openai" as const;
  readonly model: string;
  private client: OpenAI;

  constructor(apiKey: string, model: string) {
    if (!apiKey) throw new Error("OpenAI API key is required for embeddings");
    if (!model) throw new Error("OpenAI embedding model is required");
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const out: number[][] = [];
    const BATCH = 256;
    for (let i = 0; i < texts.length; i += BATCH) {
      const slice = texts.slice(i, i + BATCH);
      const res = await this.client.embeddings.create({
        model: this.model,
        input: slice,
        encoding_format: "float",
      });
      for (const item of res.data) out.push(item.embedding as number[]);
    }
    return out;
  }
}
