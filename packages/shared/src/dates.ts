import { formatInTimeZone } from "date-fns-tz";

/**
 * The single canonical timezone. Every "day" in Meridian is computed in this
 * zone for both users, regardless of where either of us physically is. This is
 * a hard rule from the spec — do not derive days from device-local time.
 */
export const APP_TIMEZONE = "America/New_York";

/** A calendar day as a plain `yyyy-MM-dd` string in ET. We never pass JS Date
 * objects across the date boundary — a Date is an instant, and turning it back
 * into a calendar day is exactly where timezone bugs live. */
export type DateStr = string;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The ET calendar day of any instant, as `yyyy-MM-dd`. This is where a stored
 * `timestamptz` (e.g. created_at) becomes the "day" it belongs to for scoring. */
export function etDate(instant: Date): DateStr {
  return formatInTimeZone(instant, APP_TIMEZONE, "yyyy-MM-dd");
}

/** Today's date in ET as `yyyy-MM-dd`. Pass `now` in tests for determinism. */
export function todayET(now: Date = new Date()): DateStr {
  return etDate(now);
}

/** Yesterday's ET date as `yyyy-MM-dd`. */
export function yesterdayET(now: Date = new Date()): DateStr {
  return addDays(todayET(now), -1);
}

/**
 * Add `n` days to a `yyyy-MM-dd` string and return a `yyyy-MM-dd` string.
 * Anchored at noon UTC so DST transitions (which happen near midnight) can
 * never bump the result into an adjacent day.
 */
export function addDays(date: DateStr, n: number): DateStr {
  const [y, m, d] = date.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d, 12, 0, 0);
  return new Date(base + n * DAY_MS).toISOString().slice(0, 10);
}

/** Inclusive list of `yyyy-MM-dd` strings from `start` to `end`. Empty if start > end. */
export function dateRange(start: DateStr, end: DateStr): DateStr[] {
  const out: DateStr[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** The `yyyy-MM` month key for a date string — used for the neutral-day monthly cap. */
export function monthKey(date: DateStr): string {
  return date.slice(0, 7);
}

/** A human-friendly label, e.g. "Mon, Jun 23". Always rendered in ET. */
export function formatDisplay(date: DateStr): string {
  const [y, m, d] = date.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return formatInTimeZone(anchor, APP_TIMEZONE, "EEE, MMM d");
}
