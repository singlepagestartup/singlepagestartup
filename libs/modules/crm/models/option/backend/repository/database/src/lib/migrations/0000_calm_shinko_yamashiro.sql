CREATE TABLE "sps_cm_option" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"class_name" text,
	"variant" text DEFAULT 'default' NOT NULL,
	"admin_title" text NOT NULL,
	"title" jsonb DEFAULT '{}'::jsonb,
	"slug" text NOT NULL,
	CONSTRAINT "sps_cm_option_slug_unique" UNIQUE("slug")
);
