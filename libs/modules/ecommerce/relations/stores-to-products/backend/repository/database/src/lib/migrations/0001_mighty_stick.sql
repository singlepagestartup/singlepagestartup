ALTER TABLE "sps_ee_ss_to_ps_vn7" ADD COLUMN "sku" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_ss_to_ps_vn7" ADD CONSTRAINT "sps_ee_ss_to_ps_vn7_sku_unique" UNIQUE("sku");