CREATE TABLE "sps_ee_store" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"short_description" text DEFAULT '',
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_ee_store_slug_unique" UNIQUE("slug")
);
