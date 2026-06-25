import { and, eq, isNull } from "drizzle-orm";
import {
  todayET,
  etDate,
  computeUserDay,
  type TodayResponse,
  type TodaySide,
  type TodayStanding,
  type UserSlot,
  type ScoringItem,
  type ScoringCheckin,
} from "@meridian/shared";
import { withAuth, json } from "../../../lib/http";
import { db } from "../../../lib/db/client";
import { nonNegotiables, checkins, neutralDays } from "../../../lib/db/schema";
import { toNonNegotiable, toCheckin } from "../../../lib/serialize";
import { getOtherIdentity, type AuthedUser } from "../../../lib/auth/user";
import { neutralDaysEnabled } from "../../../lib/config";
import { finalizePastDays } from "../../../lib/finalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Build one user's full Today picture: their active items, today's check-ins,
 * and the computed standing. A `pending:` userId (the other user hasn't signed
 * in yet) yields an empty side. */
async function buildSide(
  userId: string,
  slot: UserSlot,
  name: string,
  date: string
): Promise<TodaySide> {
  const pending = userId.startsWith("pending:");

  const items = pending
    ? []
    : await db
        .select()
        .from(nonNegotiables)
        .where(and(eq(nonNegotiables.userId, userId), isNull(nonNegotiables.archivedAt)))
        .orderBy(nonNegotiables.sortOrder);

  const cks = pending
    ? []
    : await db
        .select()
        .from(checkins)
        .where(and(eq(checkins.userId, userId), eq(checkins.date, date)));

  const neutralRow = pending
    ? []
    : await db
        .select()
        .from(neutralDays)
        .where(and(eq(neutralDays.userId, userId), eq(neutralDays.date, date)));

  const scoringItems: ScoringItem[] = items.map((it) => ({
    id: it.id,
    type: it.type as ScoringItem["type"],
    targetValue: it.targetValue,
    // These rows are all non-archived; only the ET created date can exclude one
    // (an item created later today shouldn't count until it exists).
    createdDate: etDate(it.createdAt),
    archivedDate: null,
  }));
  const scoringCheckins: ScoringCheckin[] = cks.map((c) => ({
    nonNegotiableId: c.nonNegotiableId,
    completed: c.completed,
  }));

  const day = computeUserDay(scoringItems, scoringCheckins, date);

  return {
    slot,
    userId,
    name,
    items: items.map(toNonNegotiable),
    checkins: cks.map(toCheckin),
    total: day.total,
    done: day.done,
    pct: day.pct,
    neutral: neutralRow.length > 0,
  };
}

function standingFor(me: TodaySide, other: TodaySide): TodayStanding {
  if (me.neutral || other.neutral || me.total === 0 || other.total === 0) {
    return "no_contest";
  }
  if (me.pct === other.pct) return "tied";
  return (me.pct as number) > (other.pct as number) ? "you_ahead" : "him_ahead";
}

export const GET = withAuth(async (_req, me: AuthedUser) => {
  // Keep the tally fresh; never block Today on a finalization hiccup.
  await finalizePastDays().catch(() => {});

  const date = todayET();
  const other = await getOtherIdentity(me);

  const mySide = await buildSide(me.userId, me.slot, me.name, date);
  const otherSide = await buildSide(other.userId, other.slot, other.name, date);

  const body: TodayResponse = {
    date,
    me: mySide,
    other: otherSide,
    standing: standingFor(mySide, otherSide),
    neutralDaysEnabled,
  };
  return json(body);
});
