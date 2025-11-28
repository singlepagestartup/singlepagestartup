-- title
ALTER TABLE "sps_ee_store" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_store" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_ee_store" DROP COLUMN "title";

ALTER TABLE "sps_ee_store" RENAME COLUMN "title_jsonb" TO "title";

-- short_description
ALTER TABLE "sps_ee_store" ADD COLUMN "short_description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_store" 
SET "short_description_jsonb" = jsonb_build_object('en', "short_description");

ALTER TABLE "sps_ee_store" DROP COLUMN "short_description";

ALTER TABLE "sps_ee_store" RENAME COLUMN "short_description_jsonb" TO "short_description";

-- description
ALTER TABLE "sps_ee_store" ADD COLUMN "description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_store" 
SET "description_jsonb" = jsonb_build_object('en', "description");

ALTER TABLE "sps_ee_store" DROP COLUMN "description";

ALTER TABLE "sps_ee_store" RENAME COLUMN "description_jsonb" TO "description";