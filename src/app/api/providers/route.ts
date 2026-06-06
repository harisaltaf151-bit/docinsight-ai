import { NextResponse } from "next/server";
import { PROVIDER_META } from "@/types/provider";
import type { ProvidersListResponse } from "@/types/api";

export const runtime = "edge";

export function GET(): NextResponse<ProvidersListResponse> {
  return NextResponse.json({
    providers: Object.values(PROVIDER_META),
  });
}
