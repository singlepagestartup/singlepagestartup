CREATE TABLE "sps_rc_widget" (
	"class_name" text,
	"title" text,
	"subtitle" text,
	"description" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_rc_widget_slug_unique" UNIQUE("slug")
);
