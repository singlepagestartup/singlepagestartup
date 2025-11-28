ALTER TABLE "sps_w_b_slide" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_slide" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_w_b_slide" DROP COLUMN "title";

ALTER TABLE "sps_w_b_slide" RENAME COLUMN "title_jsonb" TO "title";

-- subtitle
ALTER TABLE "sps_w_b_slide" ADD COLUMN "subtitle_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_slide" 
SET "subtitle_jsonb" = jsonb_build_object('en', "subtitle");

ALTER TABLE "sps_w_b_slide" DROP COLUMN "subtitle";

ALTER TABLE "sps_w_b_slide" RENAME COLUMN "subtitle_jsonb" TO "subtitle";

-- description
ALTER TABLE "sps_w_b_slide" ADD COLUMN "description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_slide" 
SET "description_jsonb" = jsonb_build_object('en', "description");

ALTER TABLE "sps_w_b_slide" DROP COLUMN "description";

ALTER TABLE "sps_w_b_slide" RENAME COLUMN "description_jsonb" TO "description";