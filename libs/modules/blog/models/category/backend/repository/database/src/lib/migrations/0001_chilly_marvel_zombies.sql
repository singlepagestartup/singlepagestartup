ALTER TABLE "sps_blog_category" ADD COLUMN "slug" text;

UPDATE "sps_blog_category"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_blog_category" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_blog_category" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_blog_category" ALTER COLUMN "admin_title" SET NOT NULL;