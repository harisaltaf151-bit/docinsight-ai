import type { ProviderId } from "./provider";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  /** Chunk ids retrieved for grounding this turn. */
  citations?: string[];
}

export interface ChatRequest {
  provider: ProviderId;
  model: string;
  apiKey: string;
  sessionId: string;
  message: string;
  topK?: number;
}

export interface ChatStreamEvent {
  type: "token" | "citation" | "done" | "error";
  data?: unknown;
  message?: string;
}
