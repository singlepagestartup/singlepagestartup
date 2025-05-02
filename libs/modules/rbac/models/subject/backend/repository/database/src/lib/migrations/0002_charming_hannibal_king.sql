ALTER TABLE "sps_rc_subject" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_rc_subject" ADD CONSTRAINT "sps_rc_subject_slug_unique" UNIQUE("slug");