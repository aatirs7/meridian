import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deriveCompleted,
  type TodayResponse,
  type TodaySide,
  type TodayStanding,
  type UpsertCheckinBody,
  type Checkin,
} from "@meridian/shared";
import { useApi } from "../useApi";

export const TODAY_KEY = ["today"] as const;

export function useToday() {
  const call = useApi();
  return useQuery({
    queryKey: TODAY_KEY,
    queryFn: () => call<TodayResponse>("/api/today"),
    // Poll while focused so the other person's check-ins land on their own.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Recompute one side's totals after a local check-in edit. Mirrors the server. */
function recompute(side: TodaySide): TodaySide {
  const ids = new Set(side.items.map((i) => i.id));
  const total = side.items.length;
  const done = side.checkins.filter((c) => c.completed && ids.has(c.nonNegotiableId)).length;
  const pct = total === 0 ? null : done / total;
  return { ...side, total, done, pct };
}

function standingFor(me: TodaySide, other: TodaySide): TodayStanding {
  if (me.neutral || other.neutral || me.total === 0 || other.total === 0) return "no_contest";
  if (me.pct === other.pct) return "tied";
  return (me.pct as number) > (other.pct as number) ? "you_ahead" : "him_ahead";
}

/**
 * Upsert today's check-in with an optimistic update so the tap feels instant.
 * On success the 30s poll / invalidation reconciles with the server's
 * authoritative `completed`.
 */
export function useUpsertCheckin() {
  const call = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: UpsertCheckinBody) =>
      call<Checkin>("/api/checkins", { method: "POST", body: JSON.stringify(body) }),

    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: TODAY_KEY });
      const prev = qc.getQueryData<TodayResponse>(TODAY_KEY);
      if (!prev) return { prev };

      const item = prev.me.items.find((i) => i.id === body.nonNegotiableId);
      if (!item) return { prev };

      const value =
        item.type === "binary"
          ? body.value >= 1
            ? 1
            : 0
          : Math.max(0, Math.floor(body.value));
      const completed = deriveCompleted(item.type, item.targetValue, value);

      const existing = prev.me.checkins.find((c) => c.nonNegotiableId === item.id);
      const checkins = existing
        ? prev.me.checkins.map((c) =>
            c.nonNegotiableId === item.id ? { ...c, value, completed } : c
          )
        : [
            ...prev.me.checkins,
            {
              id: `optimistic:${item.id}`,
              nonNegotiableId: item.id,
              date: prev.date,
              value,
              completed,
            },
          ];

      const meSide = recompute({ ...prev.me, checkins });
      const next: TodayResponse = {
        ...prev,
        me: meSide,
        standing: standingFor(meSide, prev.other),
      };
      qc.setQueryData(TODAY_KEY, next);
      return { prev };
    },

    onError: (_err, _body, ctx) => {
      if (ctx?.prev) qc.setQueryData(TODAY_KEY, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: TODAY_KEY });
    },
  });
}
