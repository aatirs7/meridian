import { and, gte, lte, inArray, min, max } from "drizzle-orm";
import {
  todayET,
  yesterdayET,
  addDays,
  dateRange,
  etDate,
  computeUserDay,
  decideDailyResult,
  type ScoringItem,
  type ScoringCheckin,
  type DateStr,
} from "@meridian/shared";
import { db } from "./db/client";
import { nonNegotiables, checkins, dailyResults, neutralDays, users } from "./db/schema";

/** Cap the back-scan so a long-dormant app doesn't try to settle months at once. */
const MAX_SCAN_DAYS = 60;

/**
 * Settle every past day that has check-ins but no daily_results row yet. This is
 * the source of truth for the tally — it runs on app open (via sync) and from
 * the cron backstop. Two properties make it safe to call anywhere, anytime:
 *
 *  1. It never touches `today` — today is live and must stay editable.
 *  2. Each insert is `ON CONFLICT (date) DO NOTHING`, so a finalized day is
 *     frozen forever. Re-running, or two runs racing, can only no-op. This is
 *     also why later edits to a list can't rewrite past scores.
 *
 * Returns the number of new daily_results rows written.
 */
export async function finalizePastDays(now: Date = new Date()): Promise<number> {
  const today = todayET(now);
  const end = yesterdayET(now);

  // Need both users to finalize a contest (daily_results has fixed a/b ids).
  const userRows = await db.select().from(users);
  const aUser = userRows.find((u) => u.slot === "a");
  const bUser = userRows.find((u) => u.slot === "b");
  if (!aUser || !bUser) return 0;

  // Window: from the day after the last finalized day (or the first ever
  // check-in) up to yesterday, floored to the scan cap.
  const firstCkRow = await db.select({ d: min(checkins.date) }).from(checkins);
  const firstCk = firstCkRow[0]?.d ?? null;
  if (!firstCk) return 0;

  const lastFinRow = await db.select({ d: max(dailyResults.date) }).from(dailyResults);
  const lastFin = lastFinRow[0]?.d ?? null;

  let start: DateStr = lastFin ? addDays(lastFin, 1) : firstCk;
  const floor = addDays(today, -MAX_SCAN_DAYS);
  if (start < floor) start = floor;
  if (start > end) return 0;

  const ids = [aUser.id, bUser.id];

  // All items for both users (including archived — scoring filters by date).
  const items = await db
    .select()
    .from(nonNegotiables)
    .where(inArray(nonNegotiables.userId, ids));

  const itemsByUser: Record<string, ScoringItem[]> = { [aUser.id]: [], [bUser.id]: [] };
  for (const it of items) {
    itemsByUser[it.userId]?.push({
      id: it.id,
      type: it.type as ScoringItem["type"],
      targetValue: it.targetValue,
      createdDate: etDate(it.createdAt),
      archivedDate: it.archivedAt ? etDate(it.archivedAt) : null,
    });
  }

  // Check-ins in the window, bucketed by user + date.
  const cks = await db
    .select()
    .from(checkins)
    .where(
      and(inArray(checkins.userId, ids), gte(checkins.date, start), lte(checkins.date, end))
    );

  const ckByUserDate: Record<string, Record<string, ScoringCheckin[]>> = {
    [aUser.id]: {},
    [bUser.id]: {},
  };
  for (const c of cks) {
    const byDate = ckByUserDate[c.userId];
    if (!byDate) continue;
    (byDate[c.date] ??= []).push({
      nonNegotiableId: c.nonNegotiableId,
      completed: c.completed,
    });
  }

  // Neutral days in the window, per user.
  const nds = await db
    .select()
    .from(neutralDays)
    .where(
      and(
        inArray(neutralDays.userId, ids),
        gte(neutralDays.date, start),
        lte(neutralDays.date, end)
      )
    );
  const neutralByUser: Record<string, Set<string>> = {
    [aUser.id]: new Set(),
    [bUser.id]: new Set(),
  };
  for (const n of nds) neutralByUser[n.userId]?.add(n.date);

  let written = 0;
  for (const d of dateRange(start, end)) {
    const aDay = computeUserDay(itemsByUser[aUser.id], ckByUserDate[aUser.id][d] ?? [], d);
    const bDay = computeUserDay(itemsByUser[bUser.id], ckByUserDate[bUser.id][d] ?? [], d);
    const decision = decideDailyResult(
      aDay,
      bDay,
      neutralByUser[aUser.id].has(d),
      neutralByUser[bUser.id].has(d)
    );

    const winnerUserId =
      decision.winner === "a" ? aUser.id : decision.winner === "b" ? bUser.id : null;

    const res = await db
      .insert(dailyResults)
      .values({
        date: d,
        aUserId: aUser.id,
        aPct: aDay.pct,
        bUserId: bUser.id,
        bPct: bDay.pct,
        winnerUserId,
        status: decision.status,
      })
      .onConflictDoNothing({ target: dailyResults.date })
      .returning({ date: dailyResults.date });

    if (res.length > 0) written += 1;
  }

  return written;
}
