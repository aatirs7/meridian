import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  date,
  timestamp,
  doublePrecision,
  unique,
} from "drizzle-orm/pg-core";

/**
 * The complete Meridian data model. Notes that matter:
 * - `date` columns are `mode: "string"` so we read/write plain `yyyy-MM-dd`
 *   and never let a JS Date shift the calendar day across timezones.
 * - pct columns are doublePrecision (a 0..1 ratio); display rounding happens
 *   in the client. The spec says "numeric"; a float is exact enough for a
 *   ratio and gives us clean `number | null` types with no string parsing.
 * - `daily_results` has fixed a/b slots; the server pins which user is A/B.
 */

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Apple `sub` (stable per-app user id)
  name: text("name").notNull(),
  email: text("email").notNull(),
  slot: text("slot").notNull(), // 'a' | 'b' — fixed per user, drives daily_results columns
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const nonNegotiables = pgTable("non_negotiables", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'binary' | 'target'
  targetValue: integer("target_value"), // required when type = 'target'
  unit: text("unit"), // display only
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export const checkins = pgTable(
  "checkins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    nonNegotiableId: uuid("non_negotiable_id")
      .notNull()
      .references(() => nonNegotiables.id),
    date: date("date", { mode: "string" }).notNull(), // ET local date
    value: integer("value").notNull(),
    completed: boolean("completed").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("checkins_item_date_uniq").on(t.nonNegotiableId, t.date)]
);

export const dailyResults = pgTable("daily_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull().unique(),
  aUserId: text("a_user_id").notNull(),
  aPct: doublePrecision("a_pct"),
  bUserId: text("b_user_id").notNull(),
  bPct: doublePrecision("b_pct"),
  winnerUserId: text("winner_user_id"), // null = tie or no_contest
  status: text("status").notNull(), // 'final' | 'no_contest'
  finalizedAt: timestamp("finalized_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bucketItems = pgTable("bucket_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  kind: text("kind").notNull(), // 'experience' | 'skill'
  mode: text("mode").notNull(), // 'shared' | 'challenge'
  winnerUserId: text("winner_user_id"), // challenge mode only
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const bucketProgress = pgTable(
  "bucket_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bucketItemId: uuid("bucket_item_id")
      .notNull()
      .references(() => bucketItems.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull().default("todo"), // 'todo' | 'in_progress' | 'done'
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("bucket_progress_item_user_uniq").on(t.bucketItemId, t.userId)]
);

export const neutralDays = pgTable(
  "neutral_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    date: date("date", { mode: "string" }).notNull(),
  },
  (t) => [unique("neutral_days_user_date_uniq").on(t.userId, t.date)]
);

export type UserRow = typeof users.$inferSelect;
export type NonNegotiableRow = typeof nonNegotiables.$inferSelect;
export type CheckinRow = typeof checkins.$inferSelect;
export type DailyResultRow = typeof dailyResults.$inferSelect;
export type BucketItemRow = typeof bucketItems.$inferSelect;
export type BucketProgressRow = typeof bucketProgress.$inferSelect;
export type NeutralDayRow = typeof neutralDays.$inferSelect;
