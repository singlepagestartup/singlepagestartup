-- title
ALTER TABLE "sps_blog_article" ADD COLUMN "title_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_blog_article" 
SET "title_jsonb" = jsonb_build_object('en', "title");

ALTER TABLE "sps_blog_article" DROP COLUMN "title";

ALTER TABLE "sps_blog_article" RENAME COLUMN "title_jsonb" TO "title";

-- subtitle
ALTER TABLE "sps_blog_article" ADD COLUMN "subtitle_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_blog_article" 
SET "subtitle_jsonb" = jsonb_build_object('en', "subtitle");

ALTER TABLE "sps_blog_article" DROP COLUMN "subtitle";

ALTER TABLE "sps_blog_article" RENAME COLUMN "subtitle_jsonb" TO "subtitle";

-- description
ALTER TABLE "sps_blog_article" ADD COLUMN "description_jsonb" jsonb DEFAULT '{}'::jsonb;

UPDATE "sps_blog_article" 
SET "description_jsonb" = jsonb_build_object('en', "description");

ALTER TABLE "sps_blog_article" DROP COLUMN "description";

ALTER TABLE "sps_blog_article" RENAME COLUMN "description_jsonb" TO "description";