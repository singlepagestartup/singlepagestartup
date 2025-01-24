ALTER TABLE "sps_nn_template" ADD COLUMN "slug" text;

UPDATE "sps_nn_template"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_nn_template" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_nn_template" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_nn_template" ALTER COLUMN "admin_title" SET NOT NULL;

ALTER TABLE "sps_nn_template" ADD CONSTRAINT "sps_nn_template_slug_unique" UNIQUE ("slug");