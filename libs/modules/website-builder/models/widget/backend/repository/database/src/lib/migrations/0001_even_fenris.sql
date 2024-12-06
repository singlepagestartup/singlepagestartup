ALTER TABLE "sps_w_b_widgets" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_w_b_widgets" ADD CONSTRAINT "sps_w_b_widgets_slug_unique" UNIQUE("slug");