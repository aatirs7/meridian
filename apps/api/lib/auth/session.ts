import { SignJWT, jwtVerify } from "jose";
import type { Identity, UserSlot } from "@meridian/shared";

/**
 * Meridian's own session token. After Apple verifies who you are once, we mint
 * this signed JWT and the app sends it as the Bearer on every request. It
 * carries the identity claims so request auth needs neither a Clerk call nor a
 * database hit — just a signature check.
 */

const rawSecret = process.env.SESSION_JWT_SECRET;
if (!rawSecret) throw new Error("Missing SESSION_JWT_SECRET");
const secret = new TextEncoder().encode(rawSecret);

const SESSION_TTL = "90d";

export interface SessionClaims extends Identity {
  email: string;
}

export async function mintSession(c: SessionClaims): Promise<string> {
  return new SignJWT({ slot: c.slot, name: c.name, email: c.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(c.userId)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, secret);
  return {
    userId: payload.sub as string,
    slot: payload.slot as UserSlot,
    name: payload.name as string,
    email: payload.email as string,
  };
}
