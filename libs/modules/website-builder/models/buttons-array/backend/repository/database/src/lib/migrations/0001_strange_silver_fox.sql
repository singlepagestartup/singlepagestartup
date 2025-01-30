-- title
ALTER TABLE "sps_w_b_bs_ay_8m3" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_bs_ay_8m3" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_w_b_bs_ay_8m3" DROP COLUMN "title";

ALTER TABLE "sps_w_b_bs_ay_8m3" RENAME COLUMN "title_jsonb" TO "title";


-- description
ALTER TABLE "sps_w_b_bs_ay_8m3" ADD COLUMN "description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_bs_ay_8m3" 
SET "description_jsonb" = jsonb_build_object('en', "description");

ALTER TABLE "sps_w_b_bs_ay_8m3" DROP COLUMN "description";

ALTER TABLE "sps_w_b_bs_ay_8m3" RENAME COLUMN "description_jsonb" TO "description";