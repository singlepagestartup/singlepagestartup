CREATE TABLE IF NOT EXISTS "sps_tm_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'Page' NOT NULL,
	"url" text DEFAULT '/' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer,
	CONSTRAINT "sps_tm_page_url_unique" UNIQUE("url")
);
