import { NextResponse } from "next/server";
import { analyzeRequestSchema, type AnalyzeRequest } from "@/lib/validators";
import { createProvider } from "@/lib/ai/factory";
import { streamAnalysis } from "@/lib/ai/orchestrator";
import { extractPdfText } from "@/lib/ai/pdf-parser";
import { PROVIDER_META } from "@/types/provider";

/**
 * POST /api/analyze
 *
 * Validates the request envelope, extracts document text (handling base64
 * PDFs), constructs the requested provider, and streams the three-section
 * analysis (summary → insights → actions) as a `text/event-stream` response.
 *
 * The stream emits JSON-encoded `AnalysisStreamEvent` objects, one per line
 * (`data: {...}\n\n`). Events follow the schema in `@/types/analysis`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = analyzeRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid request", code: "VALIDATION", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { provider, model, apiKey, source } = parsed.data;
  const url = new URL(req.url);
  const wantsStream =
    url.searchParams.get("stream") === "1" || parsed.data.options?.stream === true;

  if (!wantsStream) {
    return NextResponse.json(
      { message: "Non-streaming analysis is not supported. Pass options.stream = true." },
      { status: 400 },
    );
  }

  // Provider + API key validation ────────────────────────────────────────
  if (!apiKey) {
    return NextResponse.json({ message: "Missing API key. Connect a provider first." }, { status: 401 });
  }
  const meta = PROVIDER_META[provider];
  if (!meta.models.includes(model as any) && model !== meta.defaultModel) {
    return NextResponse.json(
      { message: `Unsupported model: ${model}`, supported: meta.models },
      { status: 422 },
    );
  }
  const resolvedModel = meta.models.includes(model) ? model : meta.defaultModel;

  // Document text extraction ─────────────────────────────────────────────
  let documentText: string;
  try {
    documentText = await extractDocumentText(source);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read document";
    return NextResponse.json({ message }, { status: 400 });
  }
  if (!documentText.trim()) {
    return NextResponse.json({ message: "Document contains no extractable text" }, { status: 422 });
  }

  // Provider construction ────────────────────────────────────────────────
  let aiProvider;
  try {
    aiProvider = createProvider(provider, apiKey, resolvedModel);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to construct provider";
    return NextResponse.json({ message }, { status: 500 });
  }

  // Stream ───────────────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const analysisStream = streamAnalysis({ provider: aiProvider, documentText });
  const startedAt = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const encoded of analysisStream) {
          const event = JSON.parse(encoded) as { type: string; data?: unknown };
          if (event.type === "done" && event.data && typeof event.data === "object") {
            const inner = event.data as { summary: string; insights: unknown[]; actions: unknown[] };
            const finalResult = {
              summary: inner.summary,
              insights: inner.insights,
              actions: inner.actions,
              meta: {
                provider,
                model: resolvedModel,
                latencyMs: Date.now() - startedAt,
              },
            };
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "done", data: finalResult })}\n\n`,
              ),
            );
          } else {
            controller.enqueue(encoder.encode(`data: ${encoded}\n\n`));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
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

async function extractDocumentText(
  source: AnalyzeRequest["source"],
): Promise<string> {
  if (source.type === "text") {
    return source.content;
  }
  // PDF: content is base64-encoded
  const base64 = source.content;
  if (!base64) throw new Error("PDF payload is empty");
  // Rough size guard: base64 expands ~4/3.
  if (base64.length * 0.75 > MAX_PDF_BYTES) {
    throw new Error("PDF exceeds 20 MB limit");
  }
  return extractPdfText(base64);
}
