import { NextResponse } from "next/server";
import { verifyProviderKeyRequestSchema } from "@/lib/validators";
import { verifyProviderKey } from "@/lib/ai/verify";
import { PROVIDER_META } from "@/types/provider";
import type { VerifyProviderKeyResponse } from "@/lib/validators";

/**
 * POST /api/providers/:id/health
 *
 * Verifies that an API key is usable for the requested provider by issuing
 * a minimal, low-cost call to the vendor's API:
 *   - Claude: a 5-token completion (always Haiku)
 *   - OpenAI / Groq: a `models.list` call (free)
 *   - Gemini: a `models.list` REST call (free)
 *
 * The route runs on the Node.js runtime because the Anthropic and OpenAI
 * SDKs are not edge-compatible.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  req: Request,
  { params }: RouteContext,
): Promise<NextResponse<VerifyProviderKeyResponse>> {
  const { id } = await params;
  if (!(id in PROVIDER_META)) {
    return NextResponse.json(
      { ok: false, error: `Unknown provider: ${id}` },
      { status: 404 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = verifyProviderKeyRequestSchema.safeParse({ ...json, provider: id });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const result = await verifyProviderKey(id, parsed.data.apiKey);
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
