CREATE TABLE "sps_tm_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'Page' NOT NULL,
	"url" text DEFAULT '/' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_tm_page_url_unique" UNIQUE("url"),
	CONSTRAINT "sps_tm_page_slug_unique" UNIQUE("slug")
);
