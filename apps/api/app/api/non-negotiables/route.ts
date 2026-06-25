import { eq, and, isNull, asc, desc } from "drizzle-orm";
import {
  type CreateNonNegotiableBody,
  type NonNegotiable,
  NON_NEGOTIABLE_TYPES,
  MAX_TITLE_LEN,
  MAX_UNIT_LEN,
} from "@meridian/shared";
import { withAuth, json, readJson, HttpError } from "../../../lib/http";
import { db } from "../../../lib/db/client";
import { nonNegotiables } from "../../../lib/db/schema";
import { toNonNegotiable } from "../../../lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — the caller's own non-negotiables (active + archived), ordered. */
export const GET = withAuth(async (_req, me) => {
  const rows = await db
    .select()
    .from(nonNegotiables)
    .where(eq(nonNegotiables.userId, me.userId))
    .orderBy(asc(nonNegotiables.sortOrder), asc(nonNegotiables.createdAt));
  return json<NonNegotiable[]>(rows.map(toNonNegotiable));
});

/** POST — create a non-negotiable for the caller. Appended to the end. */
export const POST = withAuth(async (req, me) => {
  const body = await readJson<CreateNonNegotiableBody>(req);

  const title = (body.title ?? "").trim();
  if (!title) throw new HttpError(400, "Title is required");
  if (title.length > MAX_TITLE_LEN) throw new HttpError(400, "Title is too long");
  if (!NON_NEGOTIABLE_TYPES.includes(body.type)) throw new HttpError(400, "Invalid type");

  let targetValue: number | null = null;
  let unit: string | null = null;
  if (body.type === "target") {
    const tv = body.targetValue;
    if (typeof tv !== "number" || !Number.isFinite(tv) || tv <= 0) {
      throw new HttpError(400, "Target items need a positive target value");
    }
    targetValue = Math.floor(tv);
    unit = body.unit ? String(body.unit).trim().slice(0, MAX_UNIT_LEN) || null : null;
  }

  // Append after the caller's current max sort_order.
  const last = await db
    .select({ sortOrder: nonNegotiables.sortOrder })
    .from(nonNegotiables)
    .where(and(eq(nonNegotiables.userId, me.userId), isNull(nonNegotiables.archivedAt)))
    .orderBy(desc(nonNegotiables.sortOrder))
    .limit(1);
  const nextSort = (last[0]?.sortOrder ?? -1) + 1;

  const [row] = await db
    .insert(nonNegotiables)
    .values({
      userId: me.userId,
      title,
      type: body.type,
      targetValue,
      unit,
      sortOrder: nextSort,
    })
    .returning();

  return json<NonNegotiable>(toNonNegotiable(row), 201);
});
