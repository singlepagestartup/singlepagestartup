ALTER TABLE "sl_widget" ADD COLUMN "title" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sl_widget" ADD COLUMN "subtitle" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sl_widget" ADD COLUMN "description" jsonb DEFAULT '{}'::jsonb;