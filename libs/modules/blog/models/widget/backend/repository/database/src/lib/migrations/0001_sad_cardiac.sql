ALTER TABLE "sps_blog_widget" ADD COLUMN "subtitle" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sps_blog_widget" ADD COLUMN "description" jsonb DEFAULT '{}'::jsonb;

-- title
ALTER TABLE "sps_blog_widget" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_blog_widget" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_blog_widget" DROP COLUMN "title";

ALTER TABLE "sps_blog_widget" RENAME COLUMN "title_jsonb" TO "title";