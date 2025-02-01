ALTER TABLE "sps_cm_widget" ADD COLUMN "subtitle" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sps_cm_widget" ADD COLUMN "description" jsonb DEFAULT '{}'::jsonb;