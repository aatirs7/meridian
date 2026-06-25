import { asc, desc, inArray } from "drizzle-orm";
import {
  type CreateBucketItemBody,
  type BucketItem,
  BUCKET_KINDS,
  BUCKET_MODES,
  MAX_TITLE_LEN,
} from "@meridian/shared";
import { withAuth, json, readJson, HttpError } from "../../../lib/http";
import { db } from "../../../lib/db/client";
import { bucketItems, bucketProgress } from "../../../lib/db/schema";
import { toBucketItem } from "../../../lib/serialize";
import type { BucketProgressRow } from "../../../lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — the whole shared list with both users' progress attached. */
export const GET = withAuth(async () => {
  const items = await db
    .select()
    .from(bucketItems)
    .orderBy(asc(bucketItems.sortOrder), asc(bucketItems.createdAt));

  const ids = items.map((i) => i.id);
  const progress: BucketProgressRow[] =
    ids.length === 0
      ? []
      : await db.select().from(bucketProgress).where(inArray(bucketProgress.bucketItemId, ids));

  const byItem = new Map<string, BucketProgressRow[]>();
  for (const p of progress) {
    const arr = byItem.get(p.bucketItemId) ?? [];
    arr.push(p);
    byItem.set(p.bucketItemId, arr);
  }

  return json<BucketItem[]>(items.map((it) => toBucketItem(it, byItem.get(it.id) ?? [])));
});

/** POST — add a shared bucket item. The creator gets a `todo` progress row. */
export const POST = withAuth(async (req, me) => {
  const body = await readJson<CreateBucketItemBody>(req);

  const title = (body.title ?? "").trim();
  if (!title) throw new HttpError(400, "Title is required");
  if (title.length > MAX_TITLE_LEN) throw new HttpError(400, "Title is too long");
  if (!BUCKET_KINDS.includes(body.kind)) throw new HttpError(400, "Invalid kind");
  if (!BUCKET_MODES.includes(body.mode)) throw new HttpError(400, "Invalid mode");

  const last = await db
    .select({ sortOrder: bucketItems.sortOrder })
    .from(bucketItems)
    .orderBy(desc(bucketItems.sortOrder))
    .limit(1);
  const nextSort = (last[0]?.sortOrder ?? -1) + 1;

  const [item] = await db
    .insert(bucketItems)
    .values({
      title,
      description: body.description ? String(body.description).trim() || null : null,
      kind: body.kind,
      mode: body.mode,
      createdBy: me.userId,
      sortOrder: nextSort,
    })
    .returning();

  const [myProgress] = await db
    .insert(bucketProgress)
    .values({ bucketItemId: item.id, userId: me.userId, status: "todo" })
    .returning();

  return json<BucketItem>(toBucketItem(item, [myProgress]), 201);
});
