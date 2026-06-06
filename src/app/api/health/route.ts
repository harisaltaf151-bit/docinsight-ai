import { NextResponse } from "next/server";
import type { HealthResponse } from "@/types/api";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const STARTED_AT = Date.now();

export function GET(): NextResponse<HealthResponse> {
  return NextResponse.json({
    status: "ok",
    version: process.env.npm_package_version ?? "0.1.0",
    uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
  });
}
