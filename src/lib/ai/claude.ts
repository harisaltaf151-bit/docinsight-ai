import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ChatParams, AIMessage } from "./provider";

/**
 * Anthropic Claude provider. Uses the official SDK's streaming helper which
 * emits `content_block_delta` events with `text_delta` payloads.
 */
export class ClaudeProvider implements AIProvider {
  readonly id = "claude" as const;
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model: string) {
    if (!apiKey) throw new Error("Claude API key is required");
    if (!model) throw new Error("Claude model is required");
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async *streamChat({
    system,
    messages,
    maxTokens = 1024,
    temperature = 0.3,
  }: ChatParams): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      system,
      messages: this.toProviderMessages(messages),
      max_tokens: maxTokens,
      temperature,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }

  private toProviderMessages(
    messages: AIMessage[],
  ): Array<{ role: "user" | "assistant"; content: string }> {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
  }
}
