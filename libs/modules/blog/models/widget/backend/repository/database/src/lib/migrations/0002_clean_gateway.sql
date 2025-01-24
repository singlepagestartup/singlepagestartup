ALTER TABLE "sps_blog_widget" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';
ALTER TABLE "sps_blog_widget" ALTER COLUMN "admin_title" SET NOT NULL;