CREATE TABLE "sps_h_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'Page' NOT NULL,
	"url" text DEFAULT '/' NOT NULL,
	"description" text DEFAULT 'Description',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"class_name" text,
	"language" text DEFAULT 'en' NOT NULL,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_h_page_url_unique" UNIQUE("url"),
	CONSTRAINT "sps_h_page_slug_unique" UNIQUE("slug")
);
