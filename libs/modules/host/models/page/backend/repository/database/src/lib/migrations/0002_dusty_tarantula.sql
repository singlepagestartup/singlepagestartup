ALTER TABLE "sps_h_page" DROP CONSTRAINT "sps_h_page_url_unique";--> statement-breakpoint
ALTER TABLE "sps_h_page" ADD COLUMN "indexing" text DEFAULT 'auto' NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_h_page" ADD CONSTRAINT "sps_h_page_url_language_unique" UNIQUE("url","language");