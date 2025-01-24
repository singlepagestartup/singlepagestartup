UPDATE "sps_w_b_modal"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_w_b_modal" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_w_b_modal" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_w_b_modal" ALTER COLUMN "admin_title" SET NOT NULL;