import { useCallback } from "react";
import { useAuth } from "./auth/AuthContext";
import { apiFetch, ApiError, type ApiFetchOptions } from "./api";

/**
 * Returns an authenticated `call(path, options)` bound to the current Meridian
 * session token. Use this as the queryFn/mutationFn for every TanStack Query
 * hook.
 */
export function useApi() {
  const { getToken } = useAuth();

  return useCallback(
    async <T = unknown>(path: string, options?: ApiFetchOptions): Promise<T> => {
      const token = await getToken();
      if (!token) {
        throw new ApiError(401, "Not signed in");
      }
      return apiFetch<T>(path, token, options);
    },
    [getToken]
  );
}
