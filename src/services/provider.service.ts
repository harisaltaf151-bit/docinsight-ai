import { apiRequest } from "./http";
import { PROVIDER_META, type ProviderId } from "@/types/provider";
import type { HealthResponse, ProvidersListResponse } from "@/types/api";
import type { VerifyProviderKeyResponse } from "@/lib/validators";

/**
 * Provider metadata service. The BFF `/api/providers` endpoint is the source
 * of truth for the live catalog; `catalog()` returns the same data baked
 * into the client so first-paint doesn't depend on the network.
 */
export const providerService = {
  list(): Promise<ProvidersListResponse> {
    return apiRequest<ProvidersListResponse>("/providers");
  },

  catalog() {
    return PROVIDER_META;
  },

  /**
   * Verifies an API key against the provider. Returns `{ok: true}` on
   * success; on failure, throws an `ApiError` with the provider's
   * human-readable message attached.
   */
  async verifyKey(provider: ProviderId, apiKey: string): Promise<VerifyProviderKeyResponse> {
    return apiRequest<VerifyProviderKeyResponse>(`/providers/${provider}/health`, {
      method: "POST",
      body: { provider, apiKey },
    });
  },
};

export const healthService = {
  check(): Promise<HealthResponse> {
    return apiRequest<HealthResponse>("/health");
  },
};
