ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;