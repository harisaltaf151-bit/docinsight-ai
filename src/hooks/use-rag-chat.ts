"use client";

import * as React from "react";
import { chatService } from "@/services";
import type { ChatMessage } from "@/types/chat";
import type { ChatRequest } from "@/lib/validators";
import type { CitationPayload } from "@/lib/rag/orchestrator";

export type ChatStatus = "idle" | "running" | "error" | "aborted";

export interface UseRagChatArgs {
  documentId: string | null;
}

export interface UseRagChatResult {
  status: ChatStatus;
  errorMessage: string | null;
  messages: ChatMessage[];
  /** Citations for the most recently finished assistant turn. */
  lastCitations: CitationPayload | null;
  /** True while a response is streaming in. */
  isStreaming: boolean;
  send: (payload: Omit<ChatRequest, "documentId" | "history" | "message"> & { message: string }) => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Stateful wrapper around `chatService.stream` for the RAG chat page.
 *
 * Maintains a rolling message history, accumulates streamed text into the
 * last assistant message, and stores citations for the most recent turn.
 */
export function useRagChat({ documentId }: UseRagChatArgs): UseRagChatResult {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [status, setStatus] = React.useState<ChatStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [lastCitations, setLastCitations] = React.useState<CitationPayload | null>(null);
  const controllerRef = React.useRef<AbortController | null>(null);
  const streamIdRef = React.useRef<string | null>(null);

  const reset = React.useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    streamIdRef.current = null;
    setMessages([]);
    setStatus("idle");
    setErrorMessage(null);
    setLastCitations(null);
  }, []);

  const stop = React.useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus((prev) => (prev === "running" ? "aborted" : prev));
  }, []);

  const send = React.useCallback(
    (input: Omit<ChatRequest, "documentId" | "history" | "message"> & { message: string }) => {
      if (!documentId) {
        setStatus("error");
        setErrorMessage("No document loaded. Process a document first.");
        return;
      }
      const trimmed = input.message.trim();
      if (!trimmed) return;

      // Cancel any in-flight stream.
      controllerRef.current?.abort();

      // Optimistically append the user message and an empty assistant
      // message that we fill in as tokens arrive.
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const assistantId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      streamIdRef.current = assistantId;
      setLastCitations(null);
      setErrorMessage(null);
      setStatus("running");
      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      // Build a trimmed history (last 10 turns, excluding the in-flight pair).
      const history = messages
        .filter((m) => m.id !== assistantId)
        .slice(-10)
        .map((m) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        }));

      const controller = chatService.stream(
        {
          ...input,
          message: trimmed,
          documentId,
          history,
        },
        (event) => {
          if (!streamIdRef.current) return;
          const targetId = streamIdRef.current;
          if (event.type === "token" && typeof event.data === "string") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === targetId ? { ...m, content: m.content + event.data } : m,
              ),
            );
          } else if (event.type === "citation" && event.data) {
            setLastCitations(event.data as CitationPayload);
          } else if (event.type === "done") {
            const citations = (event.data as { chunksRetrieved?: number } | undefined)?.chunksRetrieved;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === targetId
                  ? {
                      ...m,
                      citations:
                        typeof citations === "number" && citations > 0
                          ? m.citations ?? []
                          : m.citations,
                    }
                  : m,
              ),
            );
            setStatus("idle");
            streamIdRef.current = null;
            controllerRef.current = null;
          } else if (event.type === "error") {
            setStatus("error");
            setErrorMessage(event.message ?? "Chat failed");
            // Drop the empty assistant placeholder so the user sees a clean
            // transcript after the error.
            setMessages((prev) =>
              prev.map((m) => (m.id === targetId ? { ...m, content: m.content || "(no response)" } : m)),
            );
            streamIdRef.current = null;
            controllerRef.current = null;
          }
        },
      );
      controllerRef.current = controller;
    },
    [documentId, messages],
  );

  // Clean up on unmount.
  React.useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  return {
    status,
    errorMessage,
    messages,
    lastCitations,
    isStreaming: status === "running",
    send,
    stop,
    reset,
  };
}
