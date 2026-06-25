import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NeutralDaysResponse } from "@meridian/shared";
import { useApi } from "../useApi";
import { TODAY_KEY } from "./today";
import { TALLY_KEY } from "./tally";

export const NEUTRAL_KEY = ["neutral-days"] as const;

/** Only worth querying when the feature is on. */
export function useNeutralDays(enabled: boolean) {
  const call = useApi();
  return useQuery({
    queryKey: NEUTRAL_KEY,
    queryFn: () => call<NeutralDaysResponse>("/api/neutral-days"),
    enabled,
  });
}

export function useToggleNeutralToday() {
  const call = useApi();
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: NEUTRAL_KEY });
    qc.invalidateQueries({ queryKey: TODAY_KEY });
    qc.invalidateQueries({ queryKey: TALLY_KEY });
  };
  return useMutation({
    mutationFn: (markNeutral: boolean) =>
      call<NeutralDaysResponse>("/api/neutral-days", {
        method: markNeutral ? "POST" : "DELETE",
      }),
    onSuccess: invalidate,
  });
}
