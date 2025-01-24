ALTER TABLE "sps_blog_article" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';
ALTER TABLE "sps_blog_article" ALTER COLUMN "admin_title" SET NOT NULL;