ALTER TABLE "sps_h_page" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "sps_h_page" SET "slug" = 'page-' || encode(sha256(convert_to("url", 'UTF8')), 'hex');--> statement-breakpoint
ALTER TABLE "sps_h_page" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_h_page" ADD CONSTRAINT "sps_h_page_slug_unique" UNIQUE("slug");
