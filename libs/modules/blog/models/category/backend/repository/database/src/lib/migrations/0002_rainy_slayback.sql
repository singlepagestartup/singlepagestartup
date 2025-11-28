ALTER TABLE "sps_blog_category" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_blog_category" ADD CONSTRAINT "sps_blog_category_slug_unique" UNIQUE("slug");