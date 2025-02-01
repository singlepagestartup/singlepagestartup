ALTER TABLE "sps_cm_widget" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_cm_widget" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_cm_widget" DROP COLUMN "title";

ALTER TABLE "sps_cm_widget" RENAME COLUMN "title_jsonb" TO "title";