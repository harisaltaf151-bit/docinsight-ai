"use client";

import * as React from "react";
import { PROVIDER_META, type ProviderId } from "@/types/provider";
import { getApiKey, setApiKey, clearApiKey, getSessionItem, setSessionItem } from "@/lib/session";

const PROVIDER_KEY = "docinsight:provider";
const MODEL_KEY = "docinsight:model";

interface UseApiKey {
  provider: ProviderId;
  model: string;
  apiKey: string | null;
  hasKey: boolean;
  setProvider: (id: ProviderId) => void;
  setModel: (model: string) => void;
  saveKey: (key: string) => void;
  clearKey: () => void;
}

/**
 * Manages the active provider, model, and sessionStorage-scoped API key.
 *
 * SECURITY: API keys are never persisted to the server. They live only in
 * sessionStorage and are sent per-request to the BFF.
 */
export function useApiKey(): UseApiKey {
  const [provider, setProviderState] = React.useState<ProviderId>("openai");
  const [model, setModelState] = React.useState<string>(PROVIDER_META.openai.defaultModel);
  const [apiKey, setApiKeyState] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const p = getSessionItem<ProviderId>(PROVIDER_KEY) ?? "openai";
    const m = getSessionItem<string>(MODEL_KEY) ?? PROVIDER_META[p].defaultModel;
    setProviderState(p);
    setModelState(m);
    setApiKeyState(getApiKey(p));
  }, []);

  const setProvider = React.useCallback((id: ProviderId) => {
    setProviderState(id);
    setModelState(PROVIDER_META[id].defaultModel);
    setSessionItem(PROVIDER_KEY, id);
    setSessionItem(MODEL_KEY, PROVIDER_META[id].defaultModel);
    setApiKeyState(getApiKey(id));
    setTick((t) => t + 1);
  }, []);

  const setModel = React.useCallback(
    (m: string) => {
      setModelState(m);
      setSessionItem(MODEL_KEY, m);
    },
    [],
  );

  const saveKey = React.useCallback(
    (key: string) => {
      setApiKey(provider, key);
      setApiKeyState(key);
      setTick((t) => t + 1);
    },
    [provider],
  );

  const clearKey = React.useCallback(() => {
    clearApiKey(provider);
    setApiKeyState(null);
    setTick((t) => t + 1);
  }, [provider]);

  return {
    provider,
    model,
    apiKey,
    hasKey: Boolean(apiKey),
    setProvider,
    setModel,
    saveKey,
    clearKey,
  };
}

// tick is referenced for future re-render triggers; keep import-clean.
export const __apiKeyTick = (n: number) => n;
