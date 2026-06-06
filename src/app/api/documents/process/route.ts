import { NextResponse } from "next/server";
import { processDocumentRequestSchema } from "@/lib/validators";
import { chunkText } from "@/lib/rag/chunker";
import { createEmbeddingsProvider } from "@/lib/rag/embeddings-factory";
import { resolveEmbeddingsModel } from "@/lib/rag/embeddings";
import { documentStore } from "@/lib/rag/store";
import { extractPdfText } from "@/lib/ai/pdf-parser";

/**
 * POST /api/documents/process
 *
 * Ingests a document for the chat-with-document RAG pipeline:
 *  1. Extract plain text (PDF via pdf-parse, text passed through).
 *  2. Chunk recursively (paragraph → sentence → word → hard split).
 *  3. Embed every chunk via the requested embeddings provider.
 *  4. Persist the chunks + embeddings in the server-side document store.
 *  5. Return a `documentId` that the client uses for subsequent chat calls.
 *
 * The store expires documents after one hour; long enough for a chat
 * session, short enough to bound memory.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT_CHARS = 800_000; // ~200k tokens; safe across all 4 chat models

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = processDocumentRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid request", code: "VALIDATION", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { embeddings: emb, source, options } = parsed.data;

  // 1. Extract text ──────────────────────────────────────────────────────
  let text: string;
  try {
    if (source.type === "text") {
      text = source.content;
    } else {
      text = await extractPdfText(source.content);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read document";
    return NextResponse.json({ message }, { status: 400 });
  }

  text = text.slice(0, MAX_TEXT_CHARS).trim();
  if (!text) {
    return NextResponse.json(
      { message: "Document contains no extractable text" },
      { status: 422 },
    );
  }

  // 2. Chunk ─────────────────────────────────────────────────────────────
  const chunks = chunkText(text, {
    chunkSize: options.chunkSize,
    overlap: options.overlap,
  });
  if (chunks.length === 0) {
    return NextResponse.json(
      { message: "Document could not be split into chunks" },
      { status: 422 },
    );
  }

  // 3. Embed ─────────────────────────────────────────────────────────────
  let embeddings: number[][];
  let provider;
  try {
    provider = createEmbeddingsProvider(emb.provider, emb.apiKey, emb.model);
    embeddings = await provider.embed(chunks.map((c) => c.content));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Embedding failed";
    return NextResponse.json({ message }, { status: 502 });
  }

  if (embeddings.length !== chunks.length) {
    return NextResponse.json(
      { message: "Embeddings count does not match chunk count" },
      { status: 502 },
    );
  }

  const modelInfo = resolveEmbeddingsModel(emb.provider, emb.model);
  const dimensions = embeddings[0]?.length ?? modelInfo.dimensions;

  // 4. Persist ───────────────────────────────────────────────────────────
  const title = deriveTitle(source);
  const stored = documentStore.put({
    title: title.title,
    sourceKind: source.type,
    sourceLabel: title.sourceLabel,
    charCount: text.length,
    chunks: chunks.map((c) => ({
      id: c.id,
      index: c.index,
      content: c.content,
      charCount: c.charCount,
      wordCount: c.wordCount,
    })),
    embeddings,
    embeddingProvider: emb.provider,
    embeddingModel: emb.model,
    embeddingDimensions: dimensions,
  });

  // 5. Return metadata (never the embeddings) ────────────────────────────
  return NextResponse.json({
    documentId: stored.id,
    title: stored.title,
    sourceLabel: stored.sourceLabel,
    sourceKind: stored.sourceKind,
    charCount: stored.charCount,
    chunkCount: stored.chunks.length,
    embeddingProvider: stored.embeddingProvider,
    embeddingModel: stored.embeddingModel,
    embeddingDimensions: stored.embeddingDimensions,
    createdAt: new Date(stored.createdAt).toISOString(),
    expiresAt: new Date(stored.expiresAt).toISOString(),
  });
}

function deriveTitle(source: {
  type: "text" | "pdf";
  filename?: string;
  content?: string;
}): { title: string; sourceLabel: string } {
  if (source.type === "pdf") {
    const raw = source.filename?.trim() || "Untitled PDF";
    return { title: stripExtension(raw), sourceLabel: raw };
  }
  const firstLine =
    (source.content ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? "Pasted text";
  const title = firstLine.length > 80 ? `${firstLine.slice(0, 80).trimEnd()}…` : firstLine;
  return { title, sourceLabel: "Pasted text" };
}

function stripExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0 || idx === name.length - 1) return name;
  return name.slice(0, idx);
}
