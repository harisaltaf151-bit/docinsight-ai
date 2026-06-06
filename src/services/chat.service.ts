import { apiRequest } from "./http";
import type { ChatStreamEvent } from "@/types/chat";
import type { ChatRequest } from "@/lib/validators";

/**
 * Chat service. RAG retrieval + LLM streaming will be wired in the RAG milestone.
 */
export const chatService = {
  stream(payload: ChatRequest, onEvent: (e: ChatStreamEvent) => void): AbortController {
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify(payload),
          signal: controller.signal,
          credentials: "same-origin",
        });
        if (!res.ok || !res.body) {
          let detail = `Request failed (${res.status})`;
          try {
            const cloned = res.clone();
            const data = (await cloned.json()) as { message?: string; error?: string };
            if (data?.message) detail = `${detail}: ${data.message}`;
            else if (data?.error) detail = `${detail}: ${data.error}`;
          } catch {
            // body wasn't JSON — fall through with the status-only message
          }
          onEvent({ type: "error", message: detail });
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
              onEvent(JSON.parse(data) as ChatStreamEvent);
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
