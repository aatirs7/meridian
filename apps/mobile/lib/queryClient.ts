import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

/** Shared TanStack Query client. Conservative defaults; per-query options
 * (polling intervals, etc.) are set at each useQuery call site. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: (failureCount, error) => {
        // Don't retry auth/permission failures — they won't fix themselves.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
