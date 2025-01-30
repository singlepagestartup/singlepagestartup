-- subtitle
ALTER TABLE "sps_w_b_widgets" ADD COLUMN "subtitle_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_widgets" 
SET "subtitle_jsonb" = jsonb_build_object('en', "subtitle");

ALTER TABLE "sps_w_b_widgets" DROP COLUMN "subtitle";

ALTER TABLE "sps_w_b_widgets" RENAME COLUMN "subtitle_jsonb" TO "subtitle";

-- description
ALTER TABLE "sps_w_b_widgets" ADD COLUMN "description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_widgets" 
SET "description_jsonb" = jsonb_build_object('en', "description");

ALTER TABLE "sps_w_b_widgets" DROP COLUMN "description";

ALTER TABLE "sps_w_b_widgets" RENAME COLUMN "description_jsonb" TO "description";