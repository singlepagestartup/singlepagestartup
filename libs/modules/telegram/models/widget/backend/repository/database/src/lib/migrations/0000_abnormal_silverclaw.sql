CREATE TABLE IF NOT EXISTS "sps_tm_widget" (
	"title" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	CONSTRAINT "sps_tm_widget_slug_unique" UNIQUE("slug")
);
