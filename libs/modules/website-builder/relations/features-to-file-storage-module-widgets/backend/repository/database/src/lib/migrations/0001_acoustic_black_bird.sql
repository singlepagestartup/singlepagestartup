ALTER TABLE "sps_w_b_fs_to_ss_fe_se_me_ws_idk" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_w_b_fs_to_ss_fe_se_me_ws_idk" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;