ALTER TABLE "sps_f_s_widget" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_f_s_widget" ADD CONSTRAINT "sps_f_s_widget_slug_unique" UNIQUE("slug");