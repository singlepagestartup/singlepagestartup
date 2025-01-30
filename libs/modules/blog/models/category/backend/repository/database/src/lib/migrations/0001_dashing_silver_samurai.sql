ALTER TABLE "sps_blog_category" ADD COLUMN "subtitle" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sps_blog_category" ADD COLUMN "description" jsonb DEFAULT '{}'::jsonb;

-- title
ALTER TABLE "sps_blog_category" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_blog_category" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_blog_category" DROP COLUMN "title";

ALTER TABLE "sps_blog_category" RENAME COLUMN "title_jsonb" TO "title";