import { apiRequest, ApiError } from "@/lib/api";

/**
 * Thin facade over the BFF HTTP layer. All service modules call into here
 * so that swapping fetchers, auth headers, or base URLs happens in one place.
 */
export { apiRequest, ApiError };
