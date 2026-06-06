import type { ProviderId } from "./provider";

export type AnalysisSection = "summary" | "insights" | "actions";

export interface InsightItem {
  title: string;
  detail: string;
  importance: "low" | "medium" | "high";
}

export interface ActionItem {
  task: string;
  owner?: string;
  due?: string;
  priority: "low" | "medium" | "high";
}

export interface AnalysisMeta {
  provider: ProviderId;
  model: string;
  latencyMs: number;
  tokenUsage?: { input: number; output: number };
}

export interface AnalysisResult {
  summary: string;
  insights: InsightItem[];
  actions: ActionItem[];
  meta: AnalysisMeta;
}

export interface AnalysisStreamEvent {
  /** "token" = streamed text delta; "section" = section boundary; "done" = finished; "error" = failed. */
  type: "token" | "section" | "done" | "error";
  section?: AnalysisSection;
  /** For "section" events: "started" or "complete". */
  status?: "started" | "complete";
  /** For "token": partial text. For "section" (complete) of insights/actions: parsed array. For "done": AnalysisResult. */
  data?: unknown;
  /** For "error": human-readable message. */
  message?: string;
}
