import { Buffer } from "buffer";

/**
 * Extract plain text from a base64-encoded PDF. Used by the /api/analyze route
 * to convert uploaded PDFs into text suitable for LLM analysis.
 * 
 * Uses dynamic import to avoid pdf-parse crashing at module load time in Next.js
 * (pdf-parse reads test files via fs when first imported as a static import).
 */
export async function extractPdfText(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) {
    throw new Error("PDF payload is empty");
  }
  // Dynamic import avoids pdf-parse reading test fixtures at module load time
  // which breaks in Next.js API routes (App Router)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  const text = (data.text ?? "").trim();
  if (!text) {
    throw new Error("PDF contains no extractable text (may be scanned/image-only)");
  }
  return text;
}
