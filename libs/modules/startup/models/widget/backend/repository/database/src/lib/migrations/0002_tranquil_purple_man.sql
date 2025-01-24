UPDATE "sp_widget"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sp_widget" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sp_widget" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sp_widget" ALTER COLUMN "admin_title" SET NOT NULL;