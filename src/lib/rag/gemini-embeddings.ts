import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EmbeddingsProvider } from "./embeddings";

/**
 * Gemini embeddings provider. Uses the official SDK's `embedContent` in
 * batched `requests[]` calls. Tasks are tagged `RETRIEVAL_DOCUMENT` for
 * index time and `RETRIEVAL_QUERY` for query time.
 */
export class GeminiEmbeddingsProvider implements EmbeddingsProvider {
  readonly id = "gemini" as const;
  readonly model: string;
  private client: GoogleGenerativeAI;

  constructor(apiKey: string, model: string) {
    if (!apiKey) throw new Error("Gemini API key is required for embeddings");
    if (!model) throw new Error("Gemini embedding model is required");
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const model = this.client.getGenerativeModel({ model: this.model });
    const out: number[][] = [];
    const BATCH = 100;
    for (let i = 0; i < texts.length; i += BATCH) {
      const slice = texts.slice(i, i + BATCH);
      const res = await model.batchEmbedContents({
        requests: slice.map((t) => ({
          content: { role: "user", parts: [{ text: t }] },
          taskType: "RETRIEVAL_DOCUMENT",
        })),
      });
      for (const r of res.embeddings) {
        if (!r.values) throw new Error("Gemini returned an empty embedding");
        out.push(r.values as number[]);
      }
    }
    return out;
  }
}
