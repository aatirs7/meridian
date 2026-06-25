import { eq, and } from "drizzle-orm";
import {
  type UpdateNonNegotiableBody,
  type NonNegotiable,
  MAX_TITLE_LEN,
  MAX_UNIT_LEN,
} from "@meridian/shared";
import { withAuth, json, readJson, HttpError } from "../../../../lib/http";
import { db } from "../../../../lib/db/client";
import { nonNegotiables } from "../../../../lib/db/schema";
import { toNonNegotiable } from "../../../../lib/serialize";
import type { AuthedUser } from "../../../../lib/auth/user";

function idFromUrl(req: Request): string {
  const id = new URL(req.url).pathname.split("/").pop() ?? "";
  if (!id) throw new HttpError(400, "Missing id");
  return id;
}

/** Fetch a row and assert the caller owns it (404 if not — don't reveal it exists). */
async function ownedOr404(id: string, me: AuthedUser) {
  const row = await db.query.nonNegotiables.findFirst({
    where: (n, { eq: e }) => e(n.id, id),
  });
  if (!row || row.userId !== me.userId) throw new HttpError(404, "Not found");
  return row;
}

/** PATCH — edit title / target value / unit on your own item. */
export const PATCH = withAuth(async (req, me) => {
  const id = idFromUrl(req);
  const existing = await ownedOr404(id, me);
  const body = await readJson<UpdateNonNegotiableBody>(req);

  const patch: Partial<typeof nonNegotiables.$inferInsert> = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) throw new HttpError(400, "Title is required");
    if (title.length > MAX_TITLE_LEN) throw new HttpError(400, "Title is too long");
    patch.title = title;
  }

  if (existing.type === "target") {
    if (body.targetValue !== undefined) {
      const tv = body.targetValue;
      if (typeof tv !== "number" || !Number.isFinite(tv) || tv <= 0) {
        throw new HttpError(400, "Target value must be positive");
      }
      patch.targetValue = Math.floor(tv);
    }
    if (body.unit !== undefined) {
      patch.unit = body.unit ? String(body.unit).trim().slice(0, MAX_UNIT_LEN) || null : null;
    }
  }

  if (Object.keys(patch).length === 0) {
    return json<NonNegotiable>(toNonNegotiable(existing));
  }

  const [row] = await db
    .update(nonNegotiables)
    .set(patch)
    .where(eq(nonNegotiables.id, id))
    .returning();
  return json<NonNegotiable>(toNonNegotiable(row));
});

/** DELETE — archive (never hard-delete) to preserve history. Idempotent. */
export const DELETE = withAuth(async (req, me) => {
  const id = idFromUrl(req);
  await ownedOr404(id, me);

  const [row] = await db
    .update(nonNegotiables)
    .set({ active: false, archivedAt: new Date() })
    .where(and(eq(nonNegotiables.id, id), eq(nonNegotiables.userId, me.userId)))
    .returning();
  return json<NonNegotiable>(toNonNegotiable(row));
});
