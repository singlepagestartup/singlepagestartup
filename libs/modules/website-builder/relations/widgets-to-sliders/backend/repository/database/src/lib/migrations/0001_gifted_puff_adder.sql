ALTER TABLE "sps_w_b_ws_to_ss_dc4" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_w_b_ws_to_ss_dc4" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;