ALTER TABLE "sps_h_ps_to_ws_xyv" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_h_ps_to_ws_xyv" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;