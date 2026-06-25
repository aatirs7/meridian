import type { NonNegotiableType, DailyResultStatus } from "./enums";
import type { DateStr } from "./dates";

/**
 * The scoring rules live here, as pure functions, because two very different
 * call sites must agree exactly: the server's day-finalization writes the
 * permanent `daily_results` row, and the client renders the *live* standing for
 * today before any row exists. If these ever diverged, the number you watch all
 * day would not match the number that gets recorded. So: one implementation.
 */

/** Minimal item shape needed for scoring. `*Date` fields are ET `yyyy-MM-dd`. */
export interface ScoringItem {
  id: string;
  type: NonNegotiableType;
  targetValue: number | null;
  /** ET date the item was created. */
  createdDate: DateStr;
  /** ET date the item was archived, or null if still active. */
  archivedDate: DateStr | null;
}

/** Minimal check-in shape needed for scoring. */
export interface ScoringCheckin {
  nonNegotiableId: string;
  completed: boolean;
}

export interface UserDay {
  total: number;
  done: number;
  /** done/total, or null when there are no active items that day. */
  pct: number | null;
}

/** A->user A wins, B->user B wins, null->tie or no_contest. */
export type WinnerSlot = "a" | "b" | null;

export interface DailyDecision {
  status: DailyResultStatus;
  winner: WinnerSlot;
}

/**
 * Is an item "active on" date D? An item counts toward D's denominator if it
 * existed on D and had not yet been archived as of D. We deliberately do NOT
 * consult the live `active` flag — that reflects *now*, but a day in the past
 * must be scored against the list as it stood *then*. This is what makes
 * "archiving preserves history" and "no past edits" true at the same time:
 * archiving an item today changes today's total, never yesterday's.
 */
export function isActiveOn(item: ScoringItem, date: DateStr): boolean {
  if (item.createdDate > date) return false;
  if (item.archivedDate !== null && item.archivedDate <= date) return false;
  return true;
}

/**
 * How `completed` is derived from a logged value. The server is the source of
 * truth for this — the client never gets to assert completion directly.
 *   binary → completed when value is 1
 *   target → completed when value reaches the target
 */
export function deriveCompleted(
  type: NonNegotiableType,
  targetValue: number | null,
  value: number
): boolean {
  if (type === "binary") return value === 1;
  return value >= (targetValue ?? Infinity);
}

/**
 * Compute one user's standing for a single day. `items` may include archived
 * items (we filter by date); `checkins` must already be scoped to that day.
 */
export function computeUserDay(
  items: ScoringItem[],
  checkins: ScoringCheckin[],
  date: DateStr
): UserDay {
  const active = items.filter((it) => isActiveOn(it, date));
  const total = active.length;

  const activeIds = new Set(active.map((it) => it.id));
  const done = checkins.filter(
    (c) => c.completed && activeIds.has(c.nonNegotiableId)
  ).length;

  return { total, done, pct: total === 0 ? null : done / total };
}

/**
 * Decide a day's outcome from both users' standings. A neutral day for *either*
 * user, or a zero-item day for *either* user, makes the whole day a no_contest —
 * it never lands as a loss for anyone. Otherwise the higher pct wins; equal pct
 * is a tie (status `final`, no winner).
 */
export function decideDailyResult(
  a: UserDay,
  b: UserDay,
  aNeutral: boolean,
  bNeutral: boolean
): DailyDecision {
  if (aNeutral || bNeutral || a.total === 0 || b.total === 0) {
    return { status: "no_contest", winner: null };
  }
  // Both pcts are non-null here (total > 0 for both).
  const ap = a.pct as number;
  const bp = b.pct as number;
  if (ap === bp) return { status: "final", winner: null };
  return { status: "final", winner: ap > bp ? "a" : "b" };
}

/** Round a ratio (0..1) to a whole-number percent for display. */
export function pctToDisplay(pct: number | null): number | null {
  return pct === null ? null : Math.round(pct * 100);
}
