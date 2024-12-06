ALTER TABLE "sps_w_b_logotype" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_w_b_logotype" ADD CONSTRAINT "sps_w_b_logotype_slug_unique" UNIQUE("slug");