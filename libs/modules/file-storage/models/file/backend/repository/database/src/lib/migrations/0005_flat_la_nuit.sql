ALTER TABLE "sps_f_s_file" ADD COLUMN "private_digest" text;--> statement-breakpoint
ALTER TABLE "sps_f_s_file" ADD COLUMN "legacy_origin_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_f_s_file" ADD CONSTRAINT "sps_f_s_file_legacy_origin_id_unique" UNIQUE("legacy_origin_id");