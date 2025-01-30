ALTER TABLE "sps_ee_attribute" ADD COLUMN "string_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ee_attribute" 
SET "string_jsonb" = jsonb_build_object('en', "string");

ALTER TABLE "sps_ee_attribute" DROP COLUMN "string";

ALTER TABLE "sps_ee_attribute" RENAME COLUMN "string_jsonb" TO "string";