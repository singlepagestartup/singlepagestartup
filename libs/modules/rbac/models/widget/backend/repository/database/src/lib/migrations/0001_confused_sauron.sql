ALTER TABLE "sps_rc_widget" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_rc_widget" ADD CONSTRAINT "sps_rc_widget_slug_unique" UNIQUE("slug");