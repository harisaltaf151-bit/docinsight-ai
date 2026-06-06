import { NextResponse } from "next/server";

export const runtime = "edge";

export function POST() {
  return NextResponse.json(
    {
      message:
        "This endpoint has moved. POST your document to /api/documents/process instead.",
    },
    {
      status: 410,
      headers: { Location: "/api/documents/process" },
    },
  );
}

export function GET() {
  return NextResponse.json(
    {
      message:
        "This endpoint has moved. POST your document to /api/documents/process instead.",
    },
    {
      status: 410,
      headers: { Location: "/api/documents/process" },
    },
  );
}
