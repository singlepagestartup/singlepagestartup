ALTER TABLE "sps_w_b_ls_to_ss_fe_se_ws_uas" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_w_b_ls_to_ss_fe_se_ws_uas" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;