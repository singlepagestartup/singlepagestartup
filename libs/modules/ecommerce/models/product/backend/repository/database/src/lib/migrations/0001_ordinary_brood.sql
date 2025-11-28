-- title
ALTER TABLE "sps_ee_product" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_product" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_ee_product" DROP COLUMN "title";

ALTER TABLE "sps_ee_product" RENAME COLUMN "title_jsonb" TO "title";

-- short_description
ALTER TABLE "sps_ee_product" ADD COLUMN "short_description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_product" 
SET "short_description_jsonb" = jsonb_build_object('en', "short_description");

ALTER TABLE "sps_ee_product" DROP COLUMN "short_description";

ALTER TABLE "sps_ee_product" RENAME COLUMN "short_description_jsonb" TO "short_description";

-- description
ALTER TABLE "sps_ee_product" ADD COLUMN "description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_product" 
SET "description_jsonb" = jsonb_build_object('en', "description");

ALTER TABLE "sps_ee_product" DROP COLUMN "description";

ALTER TABLE "sps_ee_product" RENAME COLUMN "description_jsonb" TO "description";