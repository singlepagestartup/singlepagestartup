ALTER TABLE "sps_w_b_feature" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_feature" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_w_b_feature" DROP COLUMN "title";

ALTER TABLE "sps_w_b_feature" RENAME COLUMN "title_jsonb" TO "title";

-- subtitle
ALTER TABLE "sps_w_b_feature" ADD COLUMN "subtitle_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_feature" 
SET "subtitle_jsonb" = jsonb_build_object('en', "subtitle");

ALTER TABLE "sps_w_b_feature" DROP COLUMN "subtitle";

ALTER TABLE "sps_w_b_feature" RENAME COLUMN "subtitle_jsonb" TO "subtitle";

-- description
ALTER TABLE "sps_w_b_feature" ADD COLUMN "description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_feature" 
SET "description_jsonb" = jsonb_build_object('en', "description");

ALTER TABLE "sps_w_b_feature" DROP COLUMN "description";

ALTER TABLE "sps_w_b_feature" RENAME COLUMN "description_jsonb" TO "description";