CREATE TYPE "public"."biolink_theme" AS ENUM('brutalist', 'light_minimal', 'dark_mode', 'colorful');--> statement-breakpoint
CREATE TABLE "biolinks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"username" varchar(20) NOT NULL,
	"theme" "biolink_theme" DEFAULT 'light_minimal' NOT NULL,
	"custom_primary_color" varchar(7),
	"custom_bg_color" varchar(7),
	"total_views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "biolinks_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "biolinks_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "daily_link_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"biolink_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"biolink_id" uuid NOT NULL,
	"emoji" varchar(10),
	"title" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"position" integer NOT NULL,
	"total_clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_premium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "biolinks" ADD CONSTRAINT "biolinks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_link_clicks" ADD CONSTRAINT "daily_link_clicks_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_biolink_id_biolinks_id_fk" FOREIGN KEY ("biolink_id") REFERENCES "public"."biolinks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_biolink_id_biolinks_id_fk" FOREIGN KEY ("biolink_id") REFERENCES "public"."biolinks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_biolinks_username" ON "biolinks" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_link_date" ON "daily_link_clicks" USING btree ("link_id","date");--> statement-breakpoint
CREATE INDEX "idx_daily_link_clicks_link_date" ON "daily_link_clicks" USING btree ("link_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_biolink_date" ON "daily_stats" USING btree ("biolink_id","date");--> statement-breakpoint
CREATE INDEX "idx_daily_stats_biolink_date" ON "daily_stats" USING btree ("biolink_id","date");