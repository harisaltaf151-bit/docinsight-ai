import type { AIProvider } from "./provider";
import { extractJson } from "./json-parser";
import {
  type ActionItem,
  type AnalysisSection,
  type AnalysisStreamEvent,
  type InsightItem,
} from "@/types/analysis";
import { actionItemSchema, insightItemSchema } from "@/lib/validators";
import { z } from "zod";
import { SUMMARY_SYSTEM, buildSummaryUserPrompt } from "@/lib/prompts/summary";
import {
  INSIGHTS_SYSTEM,
  buildInsightsUserPrompt,
} from "@/lib/prompts/insights";
import {
  ACTIONS_SYSTEM,
  buildActionsUserPrompt,
} from "@/lib/prompts/actions";

const MAX_SECTION_TOKENS = 1500;
const MAX_TEXT_LENGTH = 100_000; // ~25k tokens, safe for all 4 providers

interface StreamAnalysisParams {
  provider: AIProvider;
  documentText: string;
}

/**
 * Run a full document analysis across three sections (summary, insights,
 * actions) and yield JSON-encoded `AnalysisStreamEvent`s as each piece becomes
 * available. Designed to be piped straight into a `text/event-stream`
 * response.
 *
 * Sections run sequentially so events arrive in the order a human would read
 * them. For each section, plain text tokens are emitted as the model streams.
 * For insights/actions, a `section` (complete) event with the parsed array is
 * emitted when the model finishes. If parsing fails the section still closes
 * cleanly with an empty array so the UI can render the other sections.
 */
export async function* streamAnalysis({
  provider,
  documentText,
}: StreamAnalysisParams): AsyncGenerator<string, void, void> {
  const text = documentText.slice(0, MAX_TEXT_LENGTH).trim();
  if (!text) {
    yield encode({ type: "error", message: "Document text is empty" });
    return;
  }

  // ─── 1. Summary (plain prose) ───────────────────────────────────────────
  yield encode({ type: "section", section: "summary", status: "started" });
  const summary = yield* streamSection(provider, "summary", {
    system: SUMMARY_SYSTEM,
    userPrompt: buildSummaryUserPrompt(text),
    jsonMode: false,
    maxTokens: 700,
  });
  if (summary === null) return;

  // summary complete
  yield encode({ type: "section", section: "summary", status: "complete" });

  // ─── 2. Insights (structured JSON) ──────────────────────────────────────
  yield encode({ type: "section", section: "insights", status: "started" });
  const insightsRaw = yield* streamSection(provider, "insights", {
    system: INSIGHTS_SYSTEM,
    userPrompt: buildInsightsUserPrompt(text),
    jsonMode: true,
    maxTokens: MAX_SECTION_TOKENS,
  });
  const insights = parseInsights(insightsRaw);
  yield encode({
    type: "section",
    section: "insights",
    status: "complete",
    data: insights,
  });

  // ─── 3. Actions (structured JSON) ───────────────────────────────────────
  yield encode({ type: "section", section: "actions", status: "started" });
  const actionsRaw = yield* streamSection(provider, "actions", {
    system: ACTIONS_SYSTEM,
    userPrompt: buildActionsUserPrompt(text),
    jsonMode: true,
    maxTokens: MAX_SECTION_TOKENS,
  });
  const actions = parseActions(actionsRaw);
  yield encode({
    type: "section",
    section: "actions",
    status: "complete",
    data: actions,
  });

  // ─── Done ────────────────────────────────────────────────────────────────
  // The BFF route wraps this with provider/model/latency meta before
  // sending to the client; we only emit the content fields here.
  const result = { summary, insights, actions };
  yield encode({ type: "done", data: result });
}

interface SectionConfig {
  system: string;
  userPrompt: string;
  jsonMode: boolean;
  maxTokens: number;
}

/**
 * Stream a single section: forward token events as they arrive, accumulate
 * the raw text, and return it once the provider closes the stream. On
 * provider error, emit an `error` event for the section and return the
 * partial buffer.
 */
async function* streamSection(
  provider: AIProvider,
  section: AnalysisSection,
  config: SectionConfig,
): AsyncGenerator<string, string | null, void> {
  let buffer = "";
  try {
    const source = provider.streamChat({
      system: config.system,
      messages: [{ role: "user", content: config.userPrompt }],
      maxTokens: config.maxTokens,
      temperature: 0.3,
      jsonMode: config.jsonMode,
    });
    for await (const delta of source) {
      buffer += delta;
      yield encode({ type: "token", section, data: delta });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Model stream failed";
    yield encode({ type: "error", message });
    return null;
  }
  return buffer;
}

function parseInsights(raw: string): InsightItem[] {
  try {
    const parsed = extractJson<{ insights: InsightItem[] }>(
      raw,
      z.object({ insights: z.array(insightItemSchema) }),
    );
    return parsed.insights;
  } catch {
    return [];
  }
}

function parseActions(raw: string): ActionItem[] {
  try {
    const parsed = extractJson<{ actions: ActionItem[] }>(
      raw,
      z.object({ actions: z.array(actionItemSchema) }),
    );
    return parsed.actions;
  } catch {
    return [];
  }
}

function encode(event: AnalysisStreamEvent): string {
  return JSON.stringify(event);
}
