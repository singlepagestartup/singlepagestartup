ALTER TABLE "sps_w_b_button" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_button" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_w_b_button" DROP COLUMN "title";

ALTER TABLE "sps_w_b_button" RENAME COLUMN "title_jsonb" TO "title";