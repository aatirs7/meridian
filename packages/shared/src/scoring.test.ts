import { describe, it, expect } from "vitest";
import {
  computeUserDay,
  decideDailyResult,
  deriveCompleted,
  isActiveOn,
  pctToDisplay,
  type ScoringItem,
  type ScoringCheckin,
} from "./scoring";
import { todayET, yesterdayET, addDays, dateRange, monthKey } from "./dates";

function binary(id: string, created = "2026-01-01", archived: string | null = null): ScoringItem {
  return { id, type: "binary", targetValue: null, createdDate: created, archivedDate: archived };
}
function target(id: string, t: number, created = "2026-01-01"): ScoringItem {
  return { id, type: "target", targetValue: t, createdDate: created, archivedDate: null };
}
function ck(nonNegotiableId: string, completed: boolean): ScoringCheckin {
  return { nonNegotiableId, completed };
}

describe("deriveCompleted", () => {
  it("binary completes only at value 1", () => {
    expect(deriveCompleted("binary", null, 1)).toBe(true);
    expect(deriveCompleted("binary", null, 0)).toBe(false);
  });
  it("target completes at or above the target", () => {
    expect(deriveCompleted("target", 30, 30)).toBe(true);
    expect(deriveCompleted("target", 30, 45)).toBe(true);
    expect(deriveCompleted("target", 30, 29)).toBe(false);
  });
});

describe("isActiveOn", () => {
  it("excludes items created after the date", () => {
    expect(isActiveOn(binary("a", "2026-06-10"), "2026-06-09")).toBe(false);
    expect(isActiveOn(binary("a", "2026-06-10"), "2026-06-10")).toBe(true);
  });
  it("excludes items on/after their archive date but keeps prior days", () => {
    const i = binary("a", "2026-01-01", "2026-06-10");
    expect(isActiveOn(i, "2026-06-09")).toBe(true);
    expect(isActiveOn(i, "2026-06-10")).toBe(false); // archived that day → excluded going forward
    expect(isActiveOn(i, "2026-06-11")).toBe(false);
  });
});

describe("computeUserDay", () => {
  const date = "2026-06-15";
  it("counts done over active total", () => {
    const items = [binary("a"), binary("b"), target("c", 30)];
    const checkins = [ck("a", true), ck("b", false), ck("c", true)];
    expect(computeUserDay(items, checkins, date)).toEqual({ total: 3, done: 2, pct: 2 / 3 });
  });
  it("returns null pct when no active items", () => {
    expect(computeUserDay([], [], date)).toEqual({ total: 0, done: 0, pct: null });
  });
  it("ignores check-ins for items not active that day", () => {
    const items = [binary("a", "2026-01-01", "2026-06-10")]; // archived before date
    const checkins = [ck("a", true)];
    expect(computeUserDay(items, checkins, date)).toEqual({ total: 0, done: 0, pct: null });
  });
});

describe("decideDailyResult", () => {
  const day = (total: number, done: number) => ({
    total,
    done,
    pct: total === 0 ? null : done / total,
  });
  it("higher pct wins", () => {
    expect(decideDailyResult(day(4, 4), day(4, 2), false, false)).toEqual({
      status: "final",
      winner: "a",
    });
    expect(decideDailyResult(day(4, 1), day(2, 2), false, false)).toEqual({
      status: "final",
      winner: "b",
    });
  });
  it("equal pct is a tie (final, no winner)", () => {
    expect(decideDailyResult(day(4, 2), day(2, 1), false, false)).toEqual({
      status: "final",
      winner: null,
    });
  });
  it("zero items on either side → no_contest", () => {
    expect(decideDailyResult(day(0, 0), day(3, 3), false, false)).toEqual({
      status: "no_contest",
      winner: null,
    });
  });
  it("a neutral day for either user → no_contest", () => {
    expect(decideDailyResult(day(4, 4), day(4, 1), true, false)).toEqual({
      status: "no_contest",
      winner: null,
    });
    expect(decideDailyResult(day(4, 4), day(4, 1), false, true)).toEqual({
      status: "no_contest",
      winner: null,
    });
  });
});

describe("pctToDisplay", () => {
  it("rounds to whole percent, passes null through", () => {
    expect(pctToDisplay(2 / 3)).toBe(67);
    expect(pctToDisplay(null)).toBe(null);
    expect(pctToDisplay(1)).toBe(100);
  });
});

describe("dates", () => {
  it("addDays crosses month/year boundaries", () => {
    expect(addDays("2026-06-15", 1)).toBe("2026-06-16");
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("addDays survives a spring-forward DST day in ET", () => {
    // 2026-03-08 is a US DST transition; adding a day must still yield the 9th.
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  });
  it("yesterday is exactly one day before today", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    expect(addDays(todayET(now), -1)).toBe(yesterdayET(now));
  });
  it("dateRange is inclusive and ordered", () => {
    expect(dateRange("2026-06-14", "2026-06-16")).toEqual([
      "2026-06-14",
      "2026-06-15",
      "2026-06-16",
    ]);
    expect(dateRange("2026-06-16", "2026-06-14")).toEqual([]);
  });
  it("monthKey extracts yyyy-MM", () => {
    expect(monthKey("2026-06-15")).toBe("2026-06");
  });
  it("todayET resolves ET calendar day across the UTC boundary", () => {
    // 03:30 UTC on Jun 15 is still Jun 14 in ET (UTC-4 in summer).
    expect(todayET(new Date("2026-06-15T03:30:00Z"))).toBe("2026-06-14");
  });
});
