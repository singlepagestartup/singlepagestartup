UPDATE "sps_w_b_button"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_w_b_button" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_w_b_button" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_w_b_button" ALTER COLUMN "admin_title" SET NOT NULL;