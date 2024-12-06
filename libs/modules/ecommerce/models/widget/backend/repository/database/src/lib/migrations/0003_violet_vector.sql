ALTER TABLE "sps_ee_widget" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_ee_widget" ADD CONSTRAINT "sps_ee_widget_slug_unique" UNIQUE("slug");