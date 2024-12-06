ALTER TABLE "sps_h_widget" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_h_widget" ADD CONSTRAINT "sps_h_widget_slug_unique" UNIQUE("slug");