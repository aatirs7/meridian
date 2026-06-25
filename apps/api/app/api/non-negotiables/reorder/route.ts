import { eq, and, inArray } from "drizzle-orm";
import { type ReorderBody, type NonNegotiable } from "@meridian/shared";
import { withAuth, json, readJson, HttpError } from "../../../../lib/http";
import { db } from "../../../../lib/db/client";
import { nonNegotiables } from "../../../../lib/db/schema";
import { toNonNegotiable } from "../../../../lib/serialize";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — set sort_order for a set of the caller's items. Items not listed are
 * left untouched. Rejects if any id isn't owned by the caller. */
export const POST = withAuth(async (req, me) => {
  const body = await readJson<ReorderBody>(req);
  const order = Array.isArray(body.order) ? body.order : [];
  if (order.length === 0) throw new HttpError(400, "Nothing to reorder");

  const ids = order.map((o) => o.id);
  const owned = await db
    .select({ id: nonNegotiables.id })
    .from(nonNegotiables)
    .where(and(eq(nonNegotiables.userId, me.userId), inArray(nonNegotiables.id, ids)));

  if (owned.length !== ids.length) {
    throw new HttpError(404, "One or more items not found");
  }

  for (const { id, sortOrder } of order) {
    await db
      .update(nonNegotiables)
      .set({ sortOrder: Math.floor(sortOrder) })
      .where(and(eq(nonNegotiables.id, id), eq(nonNegotiables.userId, me.userId)));
  }

  const rows = await db
    .select()
    .from(nonNegotiables)
    .where(eq(nonNegotiables.userId, me.userId))
    .orderBy(asc(nonNegotiables.sortOrder), asc(nonNegotiables.createdAt));
  return json<NonNegotiable[]>(rows.map(toNonNegotiable));
});
