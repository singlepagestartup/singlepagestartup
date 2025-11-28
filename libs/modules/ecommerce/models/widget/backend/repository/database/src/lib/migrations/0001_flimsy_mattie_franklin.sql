-- title
ALTER TABLE "sps_ee_widget" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_widget" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_ee_widget" DROP COLUMN "title";

ALTER TABLE "sps_ee_widget" RENAME COLUMN "title_jsonb" TO "title";

-- subtitle
ALTER TABLE "sps_ee_widget" ADD COLUMN "subtitle_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_widget" 
SET "subtitle_jsonb" = jsonb_build_object('en', "subtitle");

ALTER TABLE "sps_ee_widget" DROP COLUMN "subtitle";

ALTER TABLE "sps_ee_widget" RENAME COLUMN "subtitle_jsonb" TO "subtitle";

-- description
ALTER TABLE "sps_ee_widget" ADD COLUMN "description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_widget" 
SET "description_jsonb" = jsonb_build_object('en', "description");

ALTER TABLE "sps_ee_widget" DROP COLUMN "description";

ALTER TABLE "sps_ee_widget" RENAME COLUMN "description_jsonb" TO "description";