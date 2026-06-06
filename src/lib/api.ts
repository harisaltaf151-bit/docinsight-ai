import { getErrorMessage } from "./utils";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skip JSON parsing (used for SSE). */
  rawResponse?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

function buildUrl(path: string, query?: ApiRequestOptions["query"]): string {
  const base = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  if (!query) return base;
  const url = new URL(base, window.location.origin);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.pathname + url.search;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, query, headers, rawResponse, ...rest } = options;

  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  };

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), init);
  } catch (err) {
    throw new ApiError(getErrorMessage(err, "Network error"), 0);
  }

  if (!res.ok) {
    let payload: { message?: string; code?: string; details?: unknown } = {};
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    throw new ApiError(
      payload.message ?? `Request failed (${res.status})`,
      res.status,
      payload.code,
      payload.details,
    );
  }

  if (rawResponse) return res as unknown as T;
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}
