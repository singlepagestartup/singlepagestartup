ALTER TABLE "sps_w_b_modal" ADD COLUMN "slug_2" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_w_b_modal" ADD CONSTRAINT "sps_w_b_modal_slug_2_unique" UNIQUE("slug_2");