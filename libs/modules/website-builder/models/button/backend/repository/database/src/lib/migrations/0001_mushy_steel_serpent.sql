ALTER TABLE "sps_w_b_button" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_w_b_button" ADD CONSTRAINT "sps_w_b_button_slug_unique" UNIQUE("slug");