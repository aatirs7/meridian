CREATE TABLE "bucket_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"kind" text NOT NULL,
	"mode" text NOT NULL,
	"winner_user_id" text,
	"created_by" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bucket_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket_item_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bucket_progress_item_user_uniq" UNIQUE("bucket_item_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"non_negotiable_id" uuid NOT NULL,
	"date" date NOT NULL,
	"value" integer NOT NULL,
	"completed" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkins_item_date_uniq" UNIQUE("non_negotiable_id","date")
);
--> statement-breakpoint
CREATE TABLE "daily_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"a_user_id" text NOT NULL,
	"a_pct" double precision,
	"b_user_id" text NOT NULL,
	"b_pct" double precision,
	"winner_user_id" text,
	"status" text NOT NULL,
	"finalized_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_results_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "neutral_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	CONSTRAINT "neutral_days_user_date_uniq" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "non_negotiables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"target_value" integer,
	"unit" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"slot" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bucket_items" ADD CONSTRAINT "bucket_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_progress" ADD CONSTRAINT "bucket_progress_bucket_item_id_bucket_items_id_fk" FOREIGN KEY ("bucket_item_id") REFERENCES "public"."bucket_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_progress" ADD CONSTRAINT "bucket_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_non_negotiable_id_non_negotiables_id_fk" FOREIGN KEY ("non_negotiable_id") REFERENCES "public"."non_negotiables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neutral_days" ADD CONSTRAINT "neutral_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_negotiables" ADD CONSTRAINT "non_negotiables_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;