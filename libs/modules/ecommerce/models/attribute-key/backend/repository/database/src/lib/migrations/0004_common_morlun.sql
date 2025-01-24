UPDATE "sps_ee_ae_ky"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_ee_ae_ky" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_ee_ae_ky" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_ee_ae_ky" ALTER COLUMN "admin_title" SET NOT NULL;

ALTER TABLE "sps_ee_ae_ky" ADD CONSTRAINT "sps_ee_ae_ky_slug_unique" UNIQUE ("slug");