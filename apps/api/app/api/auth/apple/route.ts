import type { Identity } from "@meridian/shared";
import { NextResponse } from "next/server";
import { db } from "../../../../lib/db/client";
import { users } from "../../../../lib/db/schema";
import { isAllowed, slotForEmail, nameForEmail } from "../../../../lib/config";
import { verifyAppleToken } from "../../../../lib/auth/apple";
import { mintSession } from "../../../../lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  identityToken?: string;
}

interface AppleAuthResponse {
  token: string; // Meridian session JWT
  me: Identity;
}

/**
 * Sign in with Apple. The app sends the Apple identity token from the native
 * sheet; we verify it, enforce the two-user allowlist, ensure the user row, and
 * mint a Meridian session token the app uses for everything afterward. This is
 * the only route that accepts an Apple token instead of our own session.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.identityToken) {
    return NextResponse.json({ error: "Missing identityToken" }, { status: 400 });
  }

  let apple;
  try {
    apple = await verifyAppleToken(body.identityToken);
  } catch {
    return NextResponse.json({ error: "Invalid Apple token" }, { status: 401 });
  }

  // Already enrolled? Trust the stored mapping (Apple may omit email on repeat
  // sign-ins). Otherwise this is a first sign-in and we need the email to place
  // them on the allowlist.
  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, apple.sub),
  });

  let email: string;
  let slot: "a" | "b";
  let name: string;

  if (existing) {
    email = existing.email;
    slot = existing.slot as "a" | "b";
    name = existing.name;
  } else {
    if (!apple.email) {
      return NextResponse.json(
        { error: "Choose “Share My Email” the first time you sign in." },
        { status: 403 }
      );
    }
    if (!isAllowed(apple.email)) {
      return NextResponse.json({ error: "Not on the allowlist" }, { status: 403 });
    }
    const s = slotForEmail(apple.email);
    if (!s) {
      return NextResponse.json({ error: "No slot assigned for this user" }, { status: 403 });
    }
    email = apple.email;
    slot = s;
    name = nameForEmail(apple.email);

    await db
      .insert(users)
      .values({ id: apple.sub, name, email, slot })
      .onConflictDoUpdate({ target: users.id, set: { name, email, slot } });
  }

  const token = await mintSession({ userId: apple.sub, email, slot, name });
  const res: AppleAuthResponse = {
    token,
    me: { userId: apple.sub, name, slot },
  };
  return NextResponse.json(res);
}
