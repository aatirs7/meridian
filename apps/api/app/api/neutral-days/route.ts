import { eq, and } from "drizzle-orm";
import {
  todayET,
  monthKey,
  NEUTRAL_DAYS_PER_MONTH,
  type NeutralDaysResponse,
} from "@meridian/shared";
import { withAuth, json, HttpError } from "../../../lib/http";
import { db } from "../../../lib/db/client";
import { neutralDays } from "../../../lib/db/schema";
import { neutralDaysEnabled } from "../../../lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function buildResponse(userId: string): Promise<NeutralDaysResponse> {
  if (!neutralDaysEnabled) {
    return { enabled: false, dates: [], remainingThisMonth: 0 };
  }
  const rows = await db
    .select({ date: neutralDays.date })
    .from(neutralDays)
    .where(eq(neutralDays.userId, userId));
  const dates = rows.map((r) => r.date).sort().reverse();
  const thisMonth = monthKey(todayET());
  const usedThisMonth = dates.filter((d) => monthKey(d) === thisMonth).length;
  return {
    enabled: true,
    dates,
    remainingThisMonth: Math.max(0, NEUTRAL_DAYS_PER_MONTH - usedThisMonth),
  };
}

/** GET — the caller's neutral days + remaining quota this month. */
export const GET = withAuth(async (_req, me) => json(await buildResponse(me.userId)));

/** POST — mark today neutral. Capped at NEUTRAL_DAYS_PER_MONTH per ET month. */
export const POST = withAuth(async (_req, me) => {
  if (!neutralDaysEnabled) throw new HttpError(403, "Neutral days are off");

  const date = todayET();
  const already = await db.query.neutralDays.findFirst({
    where: (n, { eq: e, and: a }) => a(e(n.userId, me.userId), e(n.date, date)),
  });
  if (!already) {
    const current = await buildResponse(me.userId);
    if (current.remainingThisMonth <= 0) {
      throw new HttpError(409, "You've used all your neutral days this month");
    }
    await db
      .insert(neutralDays)
      .values({ userId: me.userId, date })
      .onConflictDoNothing({ target: [neutralDays.userId, neutralDays.date] });
  }
  return json(await buildResponse(me.userId));
});

/** DELETE — unmark today as neutral (today only; past days are frozen). */
export const DELETE = withAuth(async (_req, me) => {
  if (!neutralDaysEnabled) throw new HttpError(403, "Neutral days are off");
  const date = todayET();
  await db
    .delete(neutralDays)
    .where(and(eq(neutralDays.userId, me.userId), eq(neutralDays.date, date)));
  return json(await buildResponse(me.userId));
});
