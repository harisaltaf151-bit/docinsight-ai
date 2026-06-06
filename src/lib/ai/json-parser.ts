import type { z } from "zod";

/**
 * Extract and validate JSON from an LLM response.
 *
 * LLMs frequently wrap their JSON in markdown fences, prepend prose, or add
 * trailing commentary. This function tries four strategies in order:
 *
 *  1. The whole trimmed output is valid JSON.
 *  2. A ```json ... ``` fenced block contains valid JSON.
 *  3. The first balanced [...] or {...} substring is valid JSON.
 *
 * Throws if every strategy fails. The orchestrator falls back to an empty
 * array on parse failure so the UI can still render the other sections.
 */
export function extractJson<T>(text: string, schema: z.ZodType<T>): T {
  const trimmed = text.trim();

  // 1. Direct parse
  try {
    return schema.parse(JSON.parse(trimmed));
  } catch {
    // continue
  }

  // 2. Markdown-fenced block
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence && fence[1]) {
    try {
      return schema.parse(JSON.parse(fence[1].trim()));
    } catch {
      // continue
    }
  }

  // 3. Balanced array (try first — the most common shape for insights/actions)
  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      return schema.parse(JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1)));
    } catch {
      // continue
    }
  }

  // 4. Balanced object
  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    try {
      return schema.parse(JSON.parse(trimmed.slice(objectStart, objectEnd + 1)));
    } catch {
      // continue
    }
  }

  throw new Error("Could not extract valid JSON from model output");
}
