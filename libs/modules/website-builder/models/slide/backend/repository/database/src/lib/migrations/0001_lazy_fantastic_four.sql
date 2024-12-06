ALTER TABLE "sps_w_b_slide" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_w_b_slide" ADD CONSTRAINT "sps_w_b_slide_slug_unique" UNIQUE("slug");