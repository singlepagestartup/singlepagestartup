CREATE TABLE "sps_w_b_slide" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"title" text,
	"subtitle" text,
	"description" text,
	"class_name" text,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_w_b_slide_slug_unique" UNIQUE("slug")
);
