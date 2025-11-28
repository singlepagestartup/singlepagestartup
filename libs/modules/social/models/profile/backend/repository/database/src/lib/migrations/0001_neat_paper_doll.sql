ALTER TABLE "sl_profile" ADD COLUMN "title" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sl_profile" ADD COLUMN "subtitle" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sl_profile" ADD COLUMN "description" jsonb DEFAULT '{}'::jsonb;