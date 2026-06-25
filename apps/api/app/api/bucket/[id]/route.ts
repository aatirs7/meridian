import { eq } from "drizzle-orm";
import {
  type UpdateBucketItemBody,
  type BucketItem,
  MAX_TITLE_LEN,
} from "@meridian/shared";
import { withAuth, json, readJson, HttpError } from "../../../../lib/http";
import { db } from "../../../../lib/db/client";
import { bucketItems, bucketProgress } from "../../../../lib/db/schema";
import { toBucketItem } from "../../../../lib/serialize";

function idFromUrl(req: Request): string {
  const id = new URL(req.url).pathname.split("/").pop() ?? "";
  if (!id) throw new HttpError(400, "Missing id");
  return id;
}

async function itemOr404(id: string) {
  const row = await db.query.bucketItems.findFirst({
    where: (b, { eq: e }) => e(b.id, id),
  });
  if (!row) throw new HttpError(404, "Not found");
  return row;
}

/** PATCH — edit title/description. The list is shared, so either user may edit. */
export const PATCH = withAuth(async (req) => {
  const id = idFromUrl(req);
  await itemOr404(id);
  const body = await readJson<UpdateBucketItemBody>(req);

  const patch: Partial<typeof bucketItems.$inferInsert> = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) throw new HttpError(400, "Title is required");
    if (title.length > MAX_TITLE_LEN) throw new HttpError(400, "Title is too long");
    patch.title = title;
  }
  if (body.description !== undefined) {
    patch.description = body.description ? String(body.description).trim() || null : null;
  }

  const [row] =
    Object.keys(patch).length === 0
      ? [await itemOr404(id)]
      : await db.update(bucketItems).set(patch).where(eq(bucketItems.id, id)).returning();

  const progress = await db
    .select()
    .from(bucketProgress)
    .where(eq(bucketProgress.bucketItemId, id));
  return json<BucketItem>(toBucketItem(row, progress));
});

/** DELETE — remove a shared item and its progress rows. */
export const DELETE = withAuth(async (req) => {
  const id = idFromUrl(req);
  await itemOr404(id);

  await db.delete(bucketProgress).where(eq(bucketProgress.bucketItemId, id));
  await db.delete(bucketItems).where(eq(bucketItems.id, id));
  return json({ ok: true });
});
