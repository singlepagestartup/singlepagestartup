ALTER TABLE "sps_w_b_logotype" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_logotype" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_w_b_logotype" DROP COLUMN "title";

ALTER TABLE "sps_w_b_logotype" RENAME COLUMN "title_jsonb" TO "title";