UPDATE "sps_w_b_feature"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_w_b_feature" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_w_b_feature" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_w_b_feature" ALTER COLUMN "admin_title" SET NOT NULL;