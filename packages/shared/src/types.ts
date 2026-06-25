import type {
  NonNegotiableType,
  BucketKind,
  BucketMode,
  BucketStatus,
  DailyResultStatus,
} from "./enums";
import type { DateStr } from "./dates";

/**
 * The API contract. Every route's request and response shape lives here so the
 * client and server cannot disagree about the wire format. All dates are ET
 * `yyyy-MM-dd` strings; all timestamps are ISO strings.
 */

/** Which of the two fixed slots a user occupies. Pinned by env on the server. */
export type UserSlot = "a" | "b";

export interface Identity {
  userId: string;
  name: string;
  slot: UserSlot;
}

/** The signed-in user plus their counterpart, returned by /api/auth/sync. */
export interface SyncResponse {
  me: Identity;
  other: Identity;
  appTimezone: string;
  today: DateStr;
  neutralDaysEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Branch A — non-negotiables
// ---------------------------------------------------------------------------

export interface NonNegotiable {
  id: string;
  userId: string;
  title: string;
  type: NonNegotiableType;
  targetValue: number | null;
  unit: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  archivedAt: string | null;
}

export interface CreateNonNegotiableBody {
  title: string;
  type: NonNegotiableType;
  targetValue?: number | null;
  unit?: string | null;
}

export interface UpdateNonNegotiableBody {
  title?: string;
  targetValue?: number | null;
  unit?: string | null;
}

export interface ReorderBody {
  order: { id: string; sortOrder: number }[];
}

/** A single check-in row for today. */
export interface Checkin {
  id: string;
  nonNegotiableId: string;
  date: DateStr;
  value: number;
  completed: boolean;
}

/** Client never sends a date — the server stamps today_ET. */
export interface UpsertCheckinBody {
  nonNegotiableId: string;
  value: number;
}

// ---------------------------------------------------------------------------
// Today
// ---------------------------------------------------------------------------

/** One user's full picture for today: their items, their check-ins, their standing. */
export interface TodaySide {
  slot: UserSlot;
  userId: string;
  name: string;
  items: NonNegotiable[];
  checkins: Checkin[];
  total: number;
  done: number;
  pct: number | null;
  neutral: boolean;
}

export type TodayStanding = "you_ahead" | "him_ahead" | "tied" | "no_contest";

export interface TodayResponse {
  date: DateStr;
  me: TodaySide;
  other: TodaySide;
  /** Standing from the perspective of the requesting user. */
  standing: TodayStanding;
  neutralDaysEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Tally
// ---------------------------------------------------------------------------

export interface DailyResult {
  date: DateStr;
  status: DailyResultStatus;
  aUserId: string;
  aPct: number | null;
  bUserId: string;
  bPct: number | null;
  winnerUserId: string | null;
}

export interface TallyResponse {
  /** Wins keyed by userId, plus the shared tie count. */
  wins: Record<string, number>;
  ties: number;
  me: Identity;
  other: Identity;
  history: DailyResult[];
}

// ---------------------------------------------------------------------------
// Branch B — bucket
// ---------------------------------------------------------------------------

export interface BucketProgress {
  userId: string;
  status: BucketStatus;
  note: string | null;
  updatedAt: string;
}

export interface BucketItem {
  id: string;
  title: string;
  description: string | null;
  kind: BucketKind;
  mode: BucketMode;
  winnerUserId: string | null;
  createdBy: string;
  sortOrder: number;
  createdAt: string;
  completedAt: string | null;
  /** Both users' progress rows, always present (defaulted to `todo`). */
  progress: BucketProgress[];
}

export interface CreateBucketItemBody {
  title: string;
  description?: string | null;
  kind: BucketKind;
  mode: BucketMode;
}

export interface UpdateBucketItemBody {
  title?: string;
  description?: string | null;
}

export interface UpdateBucketProgressBody {
  status?: BucketStatus;
  note?: string | null;
}

// ---------------------------------------------------------------------------
// Neutral days (behind flag)
// ---------------------------------------------------------------------------

export interface NeutralDaysResponse {
  enabled: boolean;
  /** ET dates the requesting user has marked neutral. */
  dates: DateStr[];
  /** Remaining neutral marks for the current ET month (cap is 2). */
  remainingThisMonth: number;
}
