ALTER TABLE "sps_ee_cs_to_fe_se_me_ws_vr3" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_cs_to_fe_se_me_ws_vr3" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;