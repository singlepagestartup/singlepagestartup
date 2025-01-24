CREATE TABLE "sps_ee_widget" (
	"title" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"class_name" text,
	"subtitle" text,
	"description" text,
	"anchor" text,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_ee_widget_slug_unique" UNIQUE("slug")
);