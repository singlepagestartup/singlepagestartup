ALTER TABLE "sps_w_b_modal" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_w_b_modal" ADD CONSTRAINT "sps_w_b_modal_slug_unique" UNIQUE("slug");