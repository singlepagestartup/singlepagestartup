ALTER TABLE "sps_ee_ps_to_as_c2s" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_ps_to_as_c2s" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;