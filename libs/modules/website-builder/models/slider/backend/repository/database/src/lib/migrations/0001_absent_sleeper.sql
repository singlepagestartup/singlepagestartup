-- title
ALTER TABLE "sps_w_b_slider" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_w_b_slider" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_w_b_slider" DROP COLUMN "title";

ALTER TABLE "sps_w_b_slider" RENAME COLUMN "title_jsonb" TO "title";

-- subtitle
ALTER TABLE "sps_w_b_slider" ADD COLUMN "subtitle" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint

-- description
ALTER TABLE "sps_w_b_slider" ADD COLUMN "description" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint