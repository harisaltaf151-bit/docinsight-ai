import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, ChatParams, AIMessage } from "./provider";

/**
 * Google Gemini provider. Streams text deltas via the official SDK's
 * `generateContentStream`. The orchestrator handles JSON parsing for the
 * insights/actions sections; we just forward raw text tokens.
 */
export class GeminiProvider implements AIProvider {
  readonly id = "gemini" as const;
  readonly model: string;
  private client: GoogleGenerativeAI;

  constructor(apiKey: string, model: string) {
    if (!apiKey) throw new Error("Gemini API key is required");
    if (!model) throw new Error("Gemini model is required");
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async *streamChat({
    system,
    messages,
    maxTokens = 1024,
    temperature = 0.3,
    jsonMode = false,
  }: ChatParams): AsyncIterable<string> {
    const genModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: system,
      ...(jsonMode
        ? { generationConfig: { responseMimeType: "application/json" as const } }
        : {}),
    });

    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      }));

    if (contents.length === 0) {
      throw new Error("Gemini streamChat requires at least one user or assistant message");
    }

    const result = await genModel.generateContentStream({
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }
}
