ALTER TABLE "sps_w_b_slider" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_w_b_slider" ADD CONSTRAINT "sps_w_b_slider_slug_unique" UNIQUE("slug");