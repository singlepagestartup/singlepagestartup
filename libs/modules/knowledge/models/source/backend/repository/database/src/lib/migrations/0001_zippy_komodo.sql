ALTER TABLE "sps_ke_source" DROP CONSTRAINT "sps_ke_source_original_path_unique";--> statement-breakpoint
DROP INDEX "sps_ke_source_status_idx";--> statement-breakpoint
ALTER TABLE "sps_ke_source" ALTER COLUMN "content_hash" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "sps_ke_source" ADD COLUMN "indexed_content_hash" text;--> statement-breakpoint
ALTER TABLE "sps_ke_source" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "sps_ke_source" DROP COLUMN "original_path";--> statement-breakpoint
ALTER TABLE "sps_ke_source" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "sps_ke_source" DROP COLUMN "metadata";