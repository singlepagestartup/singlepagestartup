UPDATE "sps_ee_category"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_ee_category" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_ee_category" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_ee_category" ALTER COLUMN "admin_title" SET NOT NULL;

ALTER TABLE "sps_ee_category" ADD CONSTRAINT "sps_ee_category_slug_unique" UNIQUE ("slug");
