ALTER TABLE "sps_ee_cs_to_ps_d4v" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_cs_to_ps_d4v" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;