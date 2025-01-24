CREATE TABLE "sps_h_layout" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"title" text,
	"class_name" text,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_h_layout_slug_unique" UNIQUE("slug")
);
