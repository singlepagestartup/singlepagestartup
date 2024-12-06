ALTER TABLE "sps_w_b_bs_ay_8m3" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_w_b_bs_ay_8m3" ADD CONSTRAINT "sps_w_b_bs_ay_8m3_slug_unique" UNIQUE("slug");