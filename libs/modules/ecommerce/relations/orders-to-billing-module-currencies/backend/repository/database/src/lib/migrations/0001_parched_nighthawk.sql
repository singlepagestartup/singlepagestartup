ALTER TABLE "sps_ee_os_to_bg_me_cs_b33" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_bg_me_cs_b33" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;