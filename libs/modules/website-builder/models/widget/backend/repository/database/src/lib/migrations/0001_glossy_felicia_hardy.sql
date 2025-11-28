ALTER TABLE "sps_w_b_widgets" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_widgets" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_w_b_widgets" DROP COLUMN "title";

ALTER TABLE "sps_w_b_widgets" RENAME COLUMN "title_jsonb" TO "title";