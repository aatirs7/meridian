import { useQuery } from "@tanstack/react-query";
import type { TallyResponse } from "@meridian/shared";
import { useApi } from "../useApi";

export const TALLY_KEY = ["tally"] as const;

export function useTally() {
  const call = useApi();
  return useQuery({
    queryKey: TALLY_KEY,
    queryFn: () => call<TallyResponse>("/api/tally"),
    // The record only changes at day rollover; refetch on focus is enough.
    refetchOnWindowFocus: true,
  });
}
