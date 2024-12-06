ALTER TABLE "sps_cm_widget" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_cm_widget" ADD CONSTRAINT "sps_cm_widget_slug_unique" UNIQUE("slug");