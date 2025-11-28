ALTER TABLE "sps_rc_role" RENAME COLUMN "uid" TO "slug";--> statement-breakpoint
ALTER TABLE "sps_rc_role" DROP CONSTRAINT "sps_rc_role_uid_unique";--> statement-breakpoint
ALTER TABLE "sps_rc_role" ADD CONSTRAINT "sps_rc_role_slug_unique" UNIQUE("slug");