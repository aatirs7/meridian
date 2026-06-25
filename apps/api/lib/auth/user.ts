import type { Identity, UserSlot } from "@meridian/shared";
import { db } from "../db/client";
import { isAllowed, nameForEmail, config } from "../config";
import { verifySession } from "./session";

/** Thrown by requireUser; carries the HTTP status the route should return. */
export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export interface AuthedUser extends Identity {
  email: string;
}

/**
 * Authenticate a request from its Bearer session token. The token is signed by
 * us (see session.ts) and carries the identity claims, so this is a pure
 * signature check — no Clerk, no database round trip. We still re-assert the
 * allowlist as defense in depth in case the allowed set ever changes.
 */
export async function requireUser(req: Request): Promise<AuthedUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new AuthError(401, "Missing token");

  let claims;
  try {
    claims = await verifySession(token);
  } catch {
    throw new AuthError(401, "Invalid or expired session");
  }

  if (!isAllowed(claims.email)) throw new AuthError(403, "Not on the allowlist");

  return {
    userId: claims.userId,
    email: claims.email,
    slot: claims.slot,
    name: claims.name,
  };
}

/** The counterpart identity (the other of the two users). Synthesized from env
 * if they haven't signed in yet so the UI always has a name/slot to render. */
export async function getOtherIdentity(me: AuthedUser): Promise<Identity> {
  const otherSlot: UserSlot = me.slot === "a" ? "b" : "a";
  const otherEmail = otherSlot === "a" ? config.userAEmail : config.userBEmail;

  const row = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.slot, otherSlot),
  });
  if (!row) {
    return { userId: `pending:${otherSlot}`, name: nameForEmail(otherEmail), slot: otherSlot };
  }
  return { userId: row.id, name: row.name, slot: otherSlot };
}
