ALTER TABLE "sps_f_s_file" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "sps_f_s_file" SET "slug" = "file" WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "sps_f_s_file" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_f_s_file" ADD CONSTRAINT "sps_f_s_file_slug_unique" UNIQUE("slug");
