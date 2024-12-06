ALTER TABLE "sps_bg_widget" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_bg_widget" ADD CONSTRAINT "sps_bg_widget_slug_unique" UNIQUE("slug");