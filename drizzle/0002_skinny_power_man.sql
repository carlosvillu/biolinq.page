ALTER TABLE "biolinks" ALTER COLUMN "theme" SET DEFAULT 'brutalist';--> statement-breakpoint
ALTER TABLE "biolinks" ADD COLUMN "custom_domain" varchar(255);--> statement-breakpoint
ALTER TABLE "biolinks" ADD COLUMN "domain_verification_token" varchar(64);--> statement-breakpoint
ALTER TABLE "biolinks" ADD COLUMN "domain_ownership_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "biolinks" ADD COLUMN "cname_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "biolinks" ADD CONSTRAINT "biolinks_custom_domain_unique" UNIQUE("custom_domain");