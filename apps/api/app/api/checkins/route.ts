import { eq } from "drizzle-orm";
import {
  todayET,
  deriveCompleted,
  type UpsertCheckinBody,
  type Checkin,
  type NonNegotiableType,
} from "@meridian/shared";
import { withAuth, json, readJson, HttpError } from "../../../lib/http";
import { db } from "../../../lib/db/client";
import { checkins, nonNegotiables } from "../../../lib/db/schema";
import { toCheckin } from "../../../lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — create or update today's check-in for one of the caller's items. The
 * client sends no date; the server stamps today_ET and derives `completed`.
 * Because there is no code path that writes any other date, editing a past day
 * is impossible by construction — the spec's "no late backfill" rule.
 */
export const POST = withAuth(async (req, me) => {
  const body = await readJson<UpsertCheckinBody>(req);

  if (!body.nonNegotiableId) throw new HttpError(400, "Missing nonNegotiableId");
  if (typeof body.value !== "number" || !Number.isFinite(body.value)) {
    throw new HttpError(400, "Missing or invalid value");
  }

  // The item must exist, belong to the caller, and still be active.
  const item = await db.query.nonNegotiables.findFirst({
    where: (n, { eq: e }) => e(n.id, body.nonNegotiableId),
  });
  if (!item || item.userId !== me.userId) throw new HttpError(404, "Not found");
  if (!item.active || item.archivedAt) {
    throw new HttpError(409, "This item is archived and can't be checked in");
  }

  const type = item.type as NonNegotiableType;
  // Normalize the stored value: binary is 0/1, target is a non-negative integer.
  const value =
    type === "binary"
      ? body.value >= 1
        ? 1
        : 0
      : Math.max(0, Math.floor(body.value));
  const completed = deriveCompleted(type, item.targetValue, value);
  const date = todayET();

  const [row] = await db
    .insert(checkins)
    .values({
      userId: me.userId,
      nonNegotiableId: item.id,
      date,
      value,
      completed,
    })
    .onConflictDoUpdate({
      target: [checkins.nonNegotiableId, checkins.date],
      set: { value, completed, updatedAt: new Date() },
    })
    .returning();

  return json<Checkin>(toCheckin(row));
});
