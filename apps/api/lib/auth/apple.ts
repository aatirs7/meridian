import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Verifies a "Sign in with Apple" identity token. The mobile app sends the
 * token Apple hands it on the native sign-in sheet; we check it against Apple's
 * public keys and confirm it was issued for our app. This runs once, at the
 * /api/auth/apple enrollment endpoint — every other request uses our own
 * session token (see session.ts).
 */

const APPLE_ISSUER = "https://appleid.apple.com";

// Apple's rotating public keys, cached and refreshed by jose.
const jwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

// For native iOS Sign in with Apple, the token's `aud` is the app bundle id.
const audience = process.env.APPLE_BUNDLE_ID || "com.elysiumventures.meridian";

export interface AppleIdentity {
  /** Stable, per-app Apple user id. Always present. */
  sub: string;
  /** Present on first authorization (and when the email scope is granted). */
  email?: string;
}

export async function verifyAppleToken(identityToken: string): Promise<AppleIdentity> {
  const { payload } = await jwtVerify(identityToken, jwks, {
    issuer: APPLE_ISSUER,
    audience,
  });
  const email = typeof payload.email === "string" ? payload.email : undefined;
  return { sub: payload.sub as string, email };
}
