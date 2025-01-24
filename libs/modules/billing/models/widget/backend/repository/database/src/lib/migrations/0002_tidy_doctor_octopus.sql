UPDATE "sps_bg_widget"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_bg_widget" ADD COLUMN "title" text DEFAULT 'Default Title';
ALTER TABLE "sps_bg_widget" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_bg_widget" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_bg_widget" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "sps_bg_widget" ALTER COLUMN "admin_title" SET NOT NULL;

-- ALTER TABLE "sps_bg_widget" ADD CONSTRAINT "sps_bg_widget_slug_unique" UNIQUE ("slug");