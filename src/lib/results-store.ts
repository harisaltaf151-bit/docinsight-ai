import type { PersistedResult, ResultPreview } from "@/types/result";
import { getSessionItem, setSessionItem, removeSessionItem } from "./session";

/**
 * Client-side persistence for completed analyses. Storage is sessionStorage
 * — results vanish when the tab closes, matching the "ephemeral by default"
 * posture of the rest of the app and never sending content to the server.
 *
 * Use the `useResults` hook from `@/hooks/use-results` in components; this
 * module is the underlying imperative store.
 */

const STORE_KEY = "docinsight:results";

const isBrowser = () => typeof window !== "undefined";

function readAll(): PersistedResult[] {
  const raw = getSessionItem<PersistedResult[]>(STORE_KEY);
  return Array.isArray(raw) ? raw : [];
}

function writeAll(results: PersistedResult[]): void {
  setSessionItem(STORE_KEY, results);
}

export function listResults(): PersistedResult[] {
  if (!isBrowser()) return [];
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getResult(id: string): PersistedResult | null {
  if (!isBrowser()) return null;
  return readAll().find((r) => r.id === id) ?? null;
}

export function saveResult(result: PersistedResult): void {
  if (!isBrowser()) return;
  const existing = readAll();
  // De-dupe by id (a re-save with the same id should overwrite).
  const next = [result, ...existing.filter((r) => r.id !== result.id)];
  writeAll(next);
}

export function deleteResult(id: string): void {
  if (!isBrowser()) return;
  const next = readAll().filter((r) => r.id !== id);
  writeAll(next);
}

export function clearResults(): void {
  if (!isBrowser()) return;
  removeSessionItem(STORE_KEY);
}

const SUMMARY_PREVIEW_LEN = 180;

export function toPreview(result: PersistedResult): ResultPreview {
  const summary = result.summary?.trim() ?? "";
  const summaryPreview =
    summary.length > SUMMARY_PREVIEW_LEN
      ? `${summary.slice(0, SUMMARY_PREVIEW_LEN).trimEnd()}…`
      : summary;
  return {
    id: result.id,
    title: result.title,
    sourceLabel: result.sourceLabel,
    sourceKind: result.sourceKind,
    createdAt: result.createdAt,
    provider: result.meta.provider,
    model: result.meta.model,
    latencyMs: result.meta.latencyMs,
    summaryPreview,
    insightCount: result.insights.length,
    actionCount: result.actions.length,
  };
}

/**
 * Derive a short, human-friendly title from the source. For PDFs we strip
 * the extension; for pasted text we take the first non-empty line and clamp
 * the length.
 */
export function deriveTitle(source: { kind: "pdf" | "text"; filename?: string; text?: string }): {
  title: string;
  sourceLabel: string;
} {
  if (source.kind === "pdf") {
    const raw = source.filename?.trim() || "Untitled PDF";
    const title = stripExtension(raw);
    return { title, sourceLabel: raw };
  }
  const firstLine =
    (source.text ?? "")
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
