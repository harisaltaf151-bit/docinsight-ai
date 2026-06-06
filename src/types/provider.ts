export type ProviderId = "claude" | "openai" | "gemini" | "groq";

export interface ProviderModel {
  id: string;
  label: string;
  contextWindow: number;
  supportsStreaming: boolean;
}

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  tagline: string;
  models: ProviderModel[];
  defaultModel: string;
  keyPrefix?: string;
  docsUrl: string;
}

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  claude: {
    id: "claude",
    name: "Claude",
    tagline: "Anthropic",
    defaultModel: "claude-3-5-sonnet-latest",
    docsUrl: "https://docs.anthropic.com",
    models: [
      { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet", contextWindow: 200_000, supportsStreaming: true },
      { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku", contextWindow: 200_000, supportsStreaming: true },
      { id: "claude-3-opus-latest", label: "Claude 3 Opus", contextWindow: 200_000, supportsStreaming: true },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    tagline: "GPT family",
    defaultModel: "gpt-4o-mini",
    docsUrl: "https://platform.openai.com/docs",
    models: [
      { id: "gpt-4o", label: "GPT-4o", contextWindow: 128_000, supportsStreaming: true },
      { id: "gpt-4o-mini", label: "GPT-4o mini", contextWindow: 128_000, supportsStreaming: true },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo", contextWindow: 128_000, supportsStreaming: true },
    ],
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    tagline: "Google",
    defaultModel: "gemini-1.5-flash",
    docsUrl: "https://ai.google.dev/docs",
    models: [
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", contextWindow: 1_000_000, supportsStreaming: true },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", contextWindow: 1_000_000, supportsStreaming: true },
    ],
  },
  groq: {
    id: "groq",
    name: "Groq",
    tagline: "Fast inference",
    defaultModel: "llama-3.3-70b-versatile",
    docsUrl: "https://console.groq.com/docs",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", contextWindow: 131_072, supportsStreaming: true },
      { id: "llama3-8b-8192", label: "Llama 3 8B", contextWindow: 8_192, supportsStreaming: true },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", contextWindow: 32_768, supportsStreaming: true },
    ],
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDER_META) as ProviderId[];
