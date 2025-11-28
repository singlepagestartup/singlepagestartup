CREATE TABLE "cm_step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"class_name" text,
	"variant" text DEFAULT 'default' NOT NULL,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	"title" jsonb DEFAULT '{}'::jsonb,
	"subtitle" jsonb DEFAULT '{}'::jsonb,
	"description" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "cm_step_slug_unique" UNIQUE("slug")
);
