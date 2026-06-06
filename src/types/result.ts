import type { AnalysisResult } from "@/types/analysis";

/**
 * A persisted analysis result. The result is the same shape produced by
 * the streaming API (see `AnalysisResult`), plus session-scoped metadata:
 *  - `id`          stable client-side identifier
 *  - `title`       human-friendly label derived from the source
 *  - `sourceLabel` the filename or "Pasted text" used to build the title
 *  - `sourceKind`  "pdf" | "text" — useful for the list view icon
 *  - `createdAt`   ISO timestamp
 *
 * Persisted to sessionStorage only — see `lib/results-store.ts`.
 */
export interface PersistedResult extends AnalysisResult {
  id: string;
  title: string;
  sourceLabel: string;
  sourceKind: "pdf" | "text";
  createdAt: string;
}

/**
 * A trimmed preview of a result for the list view. Computing this lazily
 * keeps the list render cheap and lets us drop the full result text until
 * the user opens a row.
 */
export interface ResultPreview {
  id: string;
  title: string;
  sourceLabel: string;
  sourceKind: "pdf" | "text";
  createdAt: string;
  provider: PersistedResult["meta"]["provider"];
  model: string;
  latencyMs: number;
  summaryPreview: string;
  insightCount: number;
  actionCount: number;
}
