ALTER TABLE "sps_rc_subject" ADD COLUMN "slug" text;
UPDATE "sps_rc_subject" SET "slug" = CAST("id" AS text) WHERE "slug" IS NULL;