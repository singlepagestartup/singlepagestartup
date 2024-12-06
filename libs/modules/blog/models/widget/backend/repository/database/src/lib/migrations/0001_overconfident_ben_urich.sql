ALTER TABLE "sps_blog_widget" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_blog_widget" ADD CONSTRAINT "sps_blog_widget_slug_unique" UNIQUE("slug");