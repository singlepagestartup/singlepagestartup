ALTER TABLE "sps_ee_category" ADD COLUMN "subtitle" jsonb DEFAULT '{}'::jsonb;

-- title
ALTER TABLE "sps_ee_category" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_category" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_ee_category" DROP COLUMN "title";

ALTER TABLE "sps_ee_category" RENAME COLUMN "title_jsonb" TO "title";

-- description
ALTER TABLE "sps_ee_category" ADD COLUMN "description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_category" 
SET "description_jsonb" = jsonb_build_object('en', "description");

ALTER TABLE "sps_ee_category" DROP COLUMN "description";

ALTER TABLE "sps_ee_category" RENAME COLUMN "description_jsonb" TO "description";