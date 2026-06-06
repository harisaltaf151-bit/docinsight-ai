import type { ProviderId } from "@/types/provider";

/**
 * A single message in a chat conversation.
 * Kept provider-agnostic; each provider maps to its own message shape.
 */
export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatParams {
  system: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  /** When true, instructs providers that support it to force JSON output. */
  jsonMode?: boolean;
}

/**
 * AI provider abstraction. Each implementation (Claude, OpenAI, Gemini, Groq)
 * conforms to this interface so the orchestrator and BFF never touch SDK
 * specifics directly.
 *
 * The provider streams plain text deltas. The orchestrator decides how to
 * chunk them (plain prose for the summary, JSON for insights/actions).
 */
export interface AIProvider {
  readonly id: ProviderId;
  readonly model: string;

  streamChat(params: ChatParams): AsyncIterable<string>;
}
