import type { AIProvider, AIMessage } from "@/lib/ai/provider";
import type { EmbeddingsProvider } from "./embeddings";
import { retrieve, type RetrievedChunk } from "./retriever";
import { RAG_SYSTEM, buildRagUserPrompt } from "./prompts";
import type { StoredDocument } from "./store";

/**
 * RAG orchestrator: given a stored document, an embeddings provider, and a
 * chat provider, retrieve the most relevant chunks for a question, build a
 * grounded prompt, and stream the model's answer.
 *
 * Yields JSON-encoded `RagStreamEvent` strings, designed to be piped into a
 * `text/event-stream` response.
 */

export interface RagChatParams {
  document: StoredDocument;
  chatProvider: AIProvider;
  embeddingsProvider: EmbeddingsProvider;
  question: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  topK?: number;
}

export type RagStreamEvent =
  | { type: "citation"; data: CitationPayload }
  | { type: "token"; data: string }
  | { type: "done"; data: { chunksRetrieved: number; latencyMs: number } }
  | { type: "error"; message: string };

export interface CitationPayload {
  chunks: Array<{
    id: string;
    index: number;
    score: number;
    excerpt: string;
  }>;
}

export async function* streamRagChat({
  document,
  chatProvider,
  embeddingsProvider,
  question,
  history = [],
  topK = 5,
}: RagChatParams): AsyncGenerator<string, void, void> {
  const startedAt = Date.now();
  const trimmed = question.trim();
  if (!trimmed) {
    yield encode({ type: "error", message: "Empty question" });
    return;
  }
  if (document.chunks.length === 0) {
    yield encode({ type: "error", message: "Document has no chunks" });
    return;
  }

  // ── 1. Embed the query ─────────────────────────────────────────────────
  let queryVector: number[];
  try {
    const [q] = await embeddingsProvider.embed([trimmed]);
    if (!q) throw new Error("Embeddings provider returned no vector");
    queryVector = q;
  } catch (err) {
    yield encode({
      type: "error",
      message: err instanceof Error ? err.message : "Embedding failed",
    });
    return;
  }

  // ── 2. Retrieve ─────────────────────────────────────────────────────────
  let retrieved: RetrievedChunk[];
  try {
    retrieved = retrieve(document, queryVector, { topK });
  } catch (err) {
    yield encode({
      type: "error",
      message: err instanceof Error ? err.message : "Retrieval failed",
    });
    return;
  }

  // ── 3. Emit citations so the UI can render the sources panel ───────────
  yield encode({
    type: "citation",
    data: {
      chunks: retrieved.map((r, i) => ({
        id: r.chunk.id,
        index: i + 1,
        score: r.score,
        excerpt: excerpt(r.chunk.content),
      })),
    },
  });

  // ── 4. Build prompt and stream answer ──────────────────────────────────
  const userPrompt = buildRagUserPrompt({
    question: trimmed,
    history,
    retrieved,
  });

  const messages: AIMessage[] = [{ role: "user", content: userPrompt }];

  try {
    const stream = chatProvider.streamChat({
      system: RAG_SYSTEM,
      messages,
      maxTokens: 800,
      temperature: 0.2,
    });
    for await (const delta of stream) {
      yield encode({ type: "token", data: delta });
    }
  } catch (err) {
    yield encode({
      type: "error",
      message: err instanceof Error ? err.message : "Chat model failed",
    });
    return;
  }

  yield encode({
    type: "done",
    data: { chunksRetrieved: retrieved.length, latencyMs: Date.now() - startedAt },
  });
}

function encode(event: RagStreamEvent): string {
  return JSON.stringify(event);
}

function excerpt(text: string, max = 200): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}
