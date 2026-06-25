import { eq, and } from "drizzle-orm";
import {
  type UpdateBucketProgressBody,
  type BucketItem,
  type BucketStatus,
  BUCKET_STATUSES,
  MAX_NOTE_LEN,
} from "@meridian/shared";
import { withAuth, json, readJson, HttpError } from "../../../../../lib/http";
import { db } from "../../../../../lib/db/client";
import { bucketItems, bucketProgress } from "../../../../../lib/db/schema";
import { toBucketItem } from "../../../../../lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** /api/bucket/<id>/progress → the id is the segment before "progress". */
function bucketIdFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split("/");
  const id = parts[parts.length - 2] ?? "";
  if (!id) throw new HttpError(400, "Missing id");
  return id;
}

/**
 * PUT — upsert the caller's own progress (status and/or note) on a shared item,
 * then settle the item-level outcome:
 *  - shared mode: completedAt is set once both users are `done`, cleared if
 *    either reverts.
 *  - challenge mode: the first user to reach `done` wins — winnerUserId and
 *    completedAt are set once and then stick (the race is over).
 */
export const PUT = withAuth(async (req, me) => {
  const id = bucketIdFromUrl(req);
  const body = await readJson<UpdateBucketProgressBody>(req);

  const status = body.status;
  if (status !== undefined && !BUCKET_STATUSES.includes(status)) {
    throw new HttpError(400, "Invalid status");
  }
  const noteProvided = body.note !== undefined;
  const note = noteProvided
    ? body.note
      ? String(body.note).trim().slice(0, MAX_NOTE_LEN) || null
      : null
    : undefined;

  const item = await db.query.bucketItems.findFirst({
    where: (b, { eq: e }) => e(b.id, id),
  });
  if (!item) throw new HttpError(404, "Not found");

  const existing = await db.query.bucketProgress.findFirst({
    where: (p, { eq: e, and: a }) => a(e(p.bucketItemId, id), e(p.userId, me.userId)),
  });

  if (existing) {
    const set: Partial<typeof bucketProgress.$inferInsert> = { updatedAt: new Date() };
    if (status !== undefined) set.status = status;
    if (noteProvided) set.note = note ?? null;
    await db
      .update(bucketProgress)
      .set(set)
      .where(and(eq(bucketProgress.bucketItemId, id), eq(bucketProgress.userId, me.userId)));
  } else {
    await db.insert(bucketProgress).values({
      bucketItemId: id,
      userId: me.userId,
      status: status ?? "todo",
      note: noteProvided ? (note ?? null) : null,
    });
  }

  // Settle the item-level outcome from the full progress set.
  const allProgress = await db
    .select()
    .from(bucketProgress)
    .where(eq(bucketProgress.bucketItemId, id));

  const myStatus: BucketStatus = (status ?? existing?.status ?? "todo") as BucketStatus;
  const itemPatch: Partial<typeof bucketItems.$inferInsert> = {};

  if (item.mode === "shared") {
    const doneCount = allProgress.filter((p) => p.status === "done").length;
    const bothDone = doneCount >= 2;
    if (bothDone && !item.completedAt) itemPatch.completedAt = new Date();
    if (!bothDone && item.completedAt) itemPatch.completedAt = null;
  } else {
    // challenge — first to done wins, then it's locked in.
    if (myStatus === "done" && !item.winnerUserId) {
      itemPatch.winnerUserId = me.userId;
      itemPatch.completedAt = new Date();
    }
  }

  let finalItem = item;
  if (Object.keys(itemPatch).length > 0) {
    const [updated] = await db
      .update(bucketItems)
      .set(itemPatch)
      .where(eq(bucketItems.id, id))
      .returning();
    finalItem = updated;
  }

  return json<BucketItem>(toBucketItem(finalItem, allProgress));
});
