/**
 * Session-scoped client storage helpers.
 *
 * IMPORTANT: API keys are intentionally stored in sessionStorage (cleared on tab close),
 * never in localStorage and never sent to the server for persistence.
 */

const isBrowser = () => typeof window !== "undefined";

export function getSessionId(): string {
  if (!isBrowser()) return "ssr";
  const KEY = "docinsight:session";
  const existing = window.sessionStorage.getItem(KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(KEY, id);
  return id;
}

export function getSessionItem<T = string>(key: string): T | null {
  if (!isBrowser()) return null;
  const raw = window.sessionStorage.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export function setSessionItem(key: string, value: unknown): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function removeSessionItem(key: string): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(key);
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.sessionStorage.clear();
}

export function getApiKey(provider: string): string | null {
  if (!isBrowser()) return null;
  return window.sessionStorage.getItem(`docinsight:apikey:${provider}`);
}

export function setApiKey(provider: string, key: string): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(`docinsight:apikey:${provider}`, key);
}

export function clearApiKey(provider: string): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(`docinsight:apikey:${provider}`);
}
