ALTER TABLE "sp_widget" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sp_widget" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sp_widget" DROP COLUMN "title";

ALTER TABLE "sp_widget" RENAME COLUMN "title_jsonb" TO "title";

ALTER TABLE "sp_widget" ADD COLUMN "subtitle" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sp_widget" ADD COLUMN "description" jsonb DEFAULT '{}'::jsonb;