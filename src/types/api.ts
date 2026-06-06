import type { ProviderMeta } from "./provider";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: { message: string; code?: string; details?: unknown };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface ProvidersListResponse {
  providers: ProviderMeta[];
}

export interface HealthResponse {
  status: "ok";
  version: string;
  uptime: number;
}
