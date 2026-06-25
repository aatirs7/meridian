import type { UserSlot } from "@meridian/shared";

/** Centralized, validated access to the two-user configuration. All identity
 * decisions (allowlist, A/B slot, display name) flow through here so there's
 * one place the "exactly two users" rule is encoded. */

function lower(s: string): string {
  return s.trim().toLowerCase();
}

const allowedEmails: string[] = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map(lower)
  .filter(Boolean);

const userAEmail = lower(process.env.USER_A_EMAIL ?? "");
const userBEmail = lower(process.env.USER_B_EMAIL ?? "");

let names: Record<string, string> = {};
try {
  const parsed = JSON.parse(process.env.USER_NAMES ?? "{}") as Record<string, string>;
  names = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [lower(k), v]));
} catch {
  names = {};
}

export const neutralDaysEnabled = process.env.ENABLE_NEUTRAL_DAYS === "true";

export const cronSecret = process.env.CRON_SECRET ?? "";

/** Is this email one of the two allowed users? */
export function isAllowed(email: string): boolean {
  return allowedEmails.includes(lower(email));
}

/** Fixed A/B slot for an email, or null if it isn't one of the two users. */
export function slotForEmail(email: string): UserSlot | null {
  const e = lower(email);
  if (e === userAEmail) return "a";
  if (e === userBEmail) return "b";
  return null;
}

/** Authoritative display name for an email (Apple's name is unreliable). */
export function nameForEmail(email: string, fallback = "User"): string {
  return names[lower(email)] ?? fallback;
}

export const config = {
  userAEmail,
  userBEmail,
  allowedEmails,
};
