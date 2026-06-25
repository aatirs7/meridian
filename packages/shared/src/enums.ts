/**
 * Domain enums, shared verbatim by the API (Drizzle column types, validation)
 * and the mobile client (typed UI state). Keeping them here is the whole point
 * of the shared package — these strings are persisted in Postgres, so a drift
 * between client and server would be a data bug, not just a type error.
 */

/** A non-negotiable is either a checkbox or a numeric target. */
export type NonNegotiableType = "binary" | "target";

/** Bucket items are things to do or things to master. */
export type BucketKind = "experience" | "skill";

/**
 * `shared` — both work it independently; done when both reach `done`.
 * `challenge` — a race; first to `done` wins.
 */
export type BucketMode = "shared" | "challenge";

/** Per-user progress on a bucket item. */
export type BucketStatus = "todo" | "in_progress" | "done";

/**
 * A finalized day is either a real contest (`final` — a winner or a tie) or a
 * `no_contest` (someone had zero active items, or marked the day neutral). A
 * tie is represented as `final` with no winner, never its own status.
 */
export type DailyResultStatus = "final" | "no_contest";

export const NON_NEGOTIABLE_TYPES: readonly NonNegotiableType[] = ["binary", "target"];
export const BUCKET_KINDS: readonly BucketKind[] = ["experience", "skill"];
export const BUCKET_MODES: readonly BucketMode[] = ["shared", "challenge"];
export const BUCKET_STATUSES: readonly BucketStatus[] = ["todo", "in_progress", "done"];
