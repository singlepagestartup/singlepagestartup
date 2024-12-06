ALTER TABLE "sp_widget" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sp_widget" ADD CONSTRAINT "sp_widget_slug_unique" UNIQUE("slug");