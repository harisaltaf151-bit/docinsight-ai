import { apiRequest } from "./http";
import type { AnalysisResult, AnalysisStreamEvent } from "@/types/analysis";
import type { AnalyzeRequest } from "@/lib/validators";

/**
 * Analysis service — the BFF entry point for document analysis.
 *
 * Two modes are supported:
 *  - `run()`: full JSON response (non-streaming)
 *  - `stream()`: Server-Sent Events, parsed incrementally
 *
 * AI logic is intentionally NOT implemented in this milestone.
 */
export const analysisService = {
  async run(payload: AnalyzeRequest): Promise<AnalysisResult> {
    return apiRequest<AnalysisResult>("/analyze", { method: "POST", body: payload });
  },

  /**
   * Open a streaming connection. The caller is responsible for closing the stream.
   * @param onEvent invoked for each parsed SSE event
   * @returns an AbortController so the caller can cancel
   */
  stream(
    payload: AnalyzeRequest,
    onEvent: (event: AnalysisStreamEvent) => void,
  ): AbortController {
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/analyze?stream=1", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify(payload),
          signal: controller.signal,
          credentials: "same-origin",
        });
        if (!res.ok || !res.body) {
          onEvent({ type: "error", message: `Request failed (${res.status})` });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const line = raw.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              onEvent(JSON.parse(data) as AnalysisStreamEvent);
            } catch {
              onEvent({ type: "error", message: "Malformed stream event" });
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          onEvent({ type: "error", message: (err as Error).message });
        }
      }
    })();
    return controller;
  },
};
