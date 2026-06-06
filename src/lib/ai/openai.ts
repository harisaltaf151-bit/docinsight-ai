import OpenAI from "openai";
import type { AIProvider, ChatParams, AIMessage } from "./provider";
import type { ProviderId } from "@/types/provider";

interface OpenAIProviderOptions {
  /** Override the provider id (used by subclasses like Groq). */
  id?: ProviderId;
  /** Override the API base URL (used by OpenAI-compatible providers). */
  baseURL?: string;
}

/**
 * OpenAI provider. Also serves as the base class for OpenAI-compatible APIs
 * (e.g. Groq) by passing a different baseURL.
 */
export class OpenAIProvider implements AIProvider {
  readonly id: ProviderId;
  readonly model: string;
  protected client: OpenAI;

  constructor(apiKey: string, model: string, options: OpenAIProviderOptions = {}) {
    if (!apiKey) throw new Error("OpenAI API key is required");
    if (!model) throw new Error("OpenAI model is required");
    this.id = options.id ?? "openai";
    this.model = model;
    this.client = new OpenAI({ apiKey, baseURL: options.baseURL });
  }

  async *streamChat({
    system,
    messages,
    maxTokens = 1024,
    temperature = 0.3,
    jsonMode = false,
  }: ChatParams): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        ...this.toProviderMessages(messages),
      ],
      max_tokens: maxTokens,
      temperature,
      stream: true,
      ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  protected toProviderMessages(messages: AIMessage[]): AIMessage[] {
    return messages;
  }
}
