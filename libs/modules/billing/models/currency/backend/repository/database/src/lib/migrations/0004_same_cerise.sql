UPDATE "sps_bg_currency"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_bg_currency" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_bg_currency" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_bg_currency" ALTER COLUMN "admin_title" SET NOT NULL;