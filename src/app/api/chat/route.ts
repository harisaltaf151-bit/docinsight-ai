import { NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/validators";
import { createProvider } from "@/lib/ai/factory";
import { createEmbeddingsProvider } from "@/lib/rag/embeddings-factory";
import { streamRagChat } from "@/lib/rag/orchestrator";
import { documentStore } from "@/lib/rag/store";

/**
 * POST /api/chat
 *
 * RAG chat over a previously processed document:
 *  1. Validate the request and resolve the document from the store.
 *  2. Construct the chat provider and the embeddings provider.
 *  3. Stream the answer via the orchestrator (retrieve → prompt → stream).
 *
 * The response is `text/event-stream` with JSON-encoded `RagStreamEvent`s
 * (`token`, `citation`, `done`, `error`).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid request", code: "VALIDATION", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { provider, model, apiKey, embeddings, documentId, message, topK, history } =
    parsed.data;

  // 1. Document lookup ───────────────────────────────────────────────────
  const document = documentStore.get(documentId);
  if (!document) {
    return NextResponse.json(
      { message: "Document not found or expired. Re-process the document to continue." },
      { status: 410 },
    );
  }

  // 2. Providers ─────────────────────────────────────────────────────────
  let chatProvider;
  let embeddingsProvider;
  try {
    chatProvider = createProvider(provider, apiKey, model);
    embeddingsProvider = createEmbeddingsProvider(
      embeddings.provider,
      embeddings.apiKey,
      embeddings.model,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to construct provider";
    return NextResponse.json({ message }, { status: 500 });
  }

  // 3. Stream ─────────────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const source = streamRagChat({
    document,
    chatProvider,
    embeddingsProvider,
    question: message,
    history,
    topK,
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const encoded of source) {
          controller.enqueue(encoder.encode(`data: ${encoded}\n\n`));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Chat failed";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
