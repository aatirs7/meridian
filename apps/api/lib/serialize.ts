import type {
  NonNegotiable,
  Checkin,
  BucketItem,
  BucketProgress,
  DailyResult,
} from "@meridian/shared";
import type {
  NonNegotiableRow,
  CheckinRow,
  BucketItemRow,
  BucketProgressRow,
  DailyResultRow,
} from "./db/schema";

/** Row → DTO mappers. Timestamps become ISO strings; everything else passes
 * through. Keeping these in one place means the wire shape can't drift. */

export function toNonNegotiable(r: NonNegotiableRow): NonNegotiable {
  return {
    id: r.id,
    userId: r.userId,
    title: r.title,
    type: r.type as NonNegotiable["type"],
    targetValue: r.targetValue,
    unit: r.unit,
    active: r.active,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(),
    archivedAt: r.archivedAt ? r.archivedAt.toISOString() : null,
  };
}

export function toCheckin(r: CheckinRow): Checkin {
  return {
    id: r.id,
    nonNegotiableId: r.nonNegotiableId,
    date: r.date,
    value: r.value,
    completed: r.completed,
  };
}

export function toBucketProgress(r: BucketProgressRow): BucketProgress {
  return {
    userId: r.userId,
    status: r.status as BucketProgress["status"],
    note: r.note,
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function toBucketItem(r: BucketItemRow, progress: BucketProgressRow[]): BucketItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    kind: r.kind as BucketItem["kind"],
    mode: r.mode as BucketItem["mode"],
    winnerUserId: r.winnerUserId,
    createdBy: r.createdBy,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    progress: progress.map(toBucketProgress),
  };
}

export function toDailyResult(r: DailyResultRow): DailyResult {
  return {
    date: r.date,
    status: r.status as DailyResult["status"],
    aUserId: r.aUserId,
    aPct: r.aPct,
    bUserId: r.bUserId,
    bPct: r.bPct,
    winnerUserId: r.winnerUserId,
  };
}
