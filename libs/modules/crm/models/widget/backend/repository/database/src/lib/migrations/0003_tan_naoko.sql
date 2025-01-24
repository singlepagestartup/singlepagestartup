UPDATE "sps_cm_widget"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_cm_widget" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_cm_widget" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_cm_widget" ALTER COLUMN "admin_title" SET NOT NULL;