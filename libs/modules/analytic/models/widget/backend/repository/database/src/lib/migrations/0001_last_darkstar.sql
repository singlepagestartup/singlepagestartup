ALTER TABLE "sps_ac_widget" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_ac_widget" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_ac_widget" DROP COLUMN "title";

ALTER TABLE "sps_ac_widget" RENAME COLUMN "title_jsonb" TO "title";

ALTER TABLE "sps_ac_widget" ADD COLUMN "subtitle" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sps_ac_widget" ADD COLUMN "description" jsonb DEFAULT '{}'::jsonb;