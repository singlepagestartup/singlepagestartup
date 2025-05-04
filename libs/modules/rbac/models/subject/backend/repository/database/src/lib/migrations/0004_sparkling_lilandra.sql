ALTER TABLE "sps_rc_subject" ADD COLUMN "slug" text;
UPDATE "sps_rc_subject" SET "slug" = CONCAT('subject-', LOWER(REPLACE(CAST("id" AS text), '-', ''))) WHERE "slug" IS NULL;
ALTER TABLE "sps_rc_subject" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_rc_subject" ADD CONSTRAINT "sps_rc_subject_slug_unique" UNIQUE("slug");