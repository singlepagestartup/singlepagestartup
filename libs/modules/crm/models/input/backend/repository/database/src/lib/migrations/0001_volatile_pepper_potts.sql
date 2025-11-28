ALTER TABLE "sps_cm_input" ADD COLUMN "placeholder" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sps_cm_input" ADD COLUMN "label" jsonb DEFAULT '{}'::jsonb;