import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ProviderId } from "@/types/provider";

/**
 * Server-side verification of an API key for a given provider. The check
 * costs at most a few tokens (Claude makes a minimal completion; OpenAI,
 * Gemini, and Groq hit the free `models` endpoint) and surfaces a clear
 * error to the client when the key is invalid, expired, or lacks scope.
 *
 * This is intentionally a *separate* function from `createProvider`:
 * - It does not allocate the streaming/chat infrastructure
 * - It can be called from route handlers without polluting the orchestrator
 * - It centralises provider-specific error normalisation
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
/** Cheap + fast Claude model used purely for the verification ping. */
const VERIFY_CLAUDE_MODEL = "claude-3-5-haiku-latest";

export interface VerifyResult {
  ok: boolean;
  /** Provider-friendly error message; only present when `ok` is false. */
  error?: string;
  /** Model id used for the check (handy for analytics; safe to log). */
  model?: string;
}

const ANTHROPIC_AUTH_ERRORS = new Set([401, 403]);
const ANTHROPIC_BAD_REQUEST = 400;

function normaliseError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const status = (err as { status?: number }).status;
    if (status === 401) return "Invalid API key (401 Unauthorized).";
    if (status === 403) return "API key is valid but lacks permission (403 Forbidden).";
    if (status === 429) return "Rate-limited while verifying (429). Try again in a moment.";
    if (status === 400) return "Provider rejected the request (400). Check your model selection.";
    return err.message || fallback;
  }
  return fallback;
}

export async function verifyProviderKey(
  id: ProviderId,
  apiKey: string,
): Promise<VerifyResult> {
  if (!apiKey || apiKey.length < 10) {
    return { ok: false, error: "API key is missing or too short." };
  }
  switch (id) {
    case "claude":
      return verifyClaude(apiKey);
    case "openai":
      return verifyOpenAI(apiKey);
    case "gemini":
      return verifyGemini(apiKey);
    case "groq":
      return verifyGroq(apiKey);
    default: {
      const exhaustive: never = id;
      return { ok: false, error: `Unsupported provider: ${String(exhaustive)}` };
    }
  }
}

async function verifyClaude(apiKey: string): Promise<VerifyResult> {
  try {
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: VERIFY_CLAUDE_MODEL,
      max_tokens: 5,
      messages: [{ role: "user", content: "." }],
    });
    return { ok: true, model: VERIFY_CLAUDE_MODEL };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status && ANTHROPIC_AUTH_ERRORS.has(status)) {
      return { ok: false, error: "Invalid Anthropic API key." };
    }
    if (status === ANTHROPIC_BAD_REQUEST) {
      return {
        ok: false,
        error: "Anthropic rejected the request. Check that the key is active and not workspace-scoped to a disallowed model.",
      };
    }
    return { ok: false, error: normaliseError(err, "Anthropic verification failed") };
  }
}

async function verifyOpenAI(apiKey: string): Promise<VerifyResult> {
  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return { ok: true };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401) return { ok: false, error: "Invalid OpenAI API key." };
    return { ok: false, error: normaliseError(err, "OpenAI verification failed") };
  }
}

async function verifyGemini(apiKey: string): Promise<VerifyResult> {
  try {
    const url = `${GEMINI_BASE_URL}/models?key=${encodeURIComponent(apiKey)}&pageSize=1`;
    const res = await fetch(url, { method: "GET" });
    if (res.ok) return { ok: true };
    if (res.status === 400 || res.status === 403) {
      return { ok: false, error: "Invalid Gemini API key." };
    }
    return { ok: false, error: `Gemini verification failed (${res.status}).` };
  } catch (err) {
    return { ok: false, error: normaliseError(err, "Gemini verification failed") };
  }
}

async function verifyGroq(apiKey: string): Promise<VerifyResult> {
  try {
    const client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
    await client.models.list();
    return { ok: true };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401) return { ok: false, error: "Invalid Groq API key." };
    return { ok: false, error: normaliseError(err, "Groq verification failed") };
  }
}
