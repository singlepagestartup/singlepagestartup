ALTER TABLE "sps_w_b_feature" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_w_b_feature" ADD CONSTRAINT "sps_w_b_feature_slug_unique" UNIQUE("slug");