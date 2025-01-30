-- title
ALTER TABLE "sps_ee_ae_ky" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_ae_ky" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_ee_ae_ky" DROP COLUMN "title";

ALTER TABLE "sps_ee_ae_ky" RENAME COLUMN "title_jsonb" TO "title";

-- prefix
ALTER TABLE "sps_ee_ae_ky" ADD COLUMN "prefix_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_ae_ky" 
SET "prefix_jsonb" = jsonb_build_object('en', "prefix");

ALTER TABLE "sps_ee_ae_ky" DROP COLUMN "prefix";

ALTER TABLE "sps_ee_ae_ky" RENAME COLUMN "prefix_jsonb" TO "prefix";

-- suffix
ALTER TABLE "sps_ee_ae_ky" ADD COLUMN "suffix_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_ae_ky" 
SET "suffix_jsonb" = jsonb_build_object('en', "suffix");

ALTER TABLE "sps_ee_ae_ky" DROP COLUMN "suffix";

ALTER TABLE "sps_ee_ae_ky" RENAME COLUMN "suffix_jsonb" TO "suffix";