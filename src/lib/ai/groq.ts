import { OpenAIProvider } from "./openai";
import type { ChatParams } from "./provider";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/**
 * Groq provider — OpenAI-compatible API, so we reuse the OpenAI client with a
 * custom base URL. Note: Groq's llama models do not support response_format
 * json_object, so we disable jsonMode and rely on prompt instructions instead.
 */
export class GroqProvider extends OpenAIProvider {
  constructor(apiKey: string, model: string) {
    super(apiKey, model, { id: "groq", baseURL: GROQ_BASE_URL });
  }

  async *streamChat(params: ChatParams): AsyncIterable<string> {
    // Force jsonMode off — Groq llama models reject response_format: json_object
    yield* super.streamChat({ ...params, jsonMode: false });
  }
}
