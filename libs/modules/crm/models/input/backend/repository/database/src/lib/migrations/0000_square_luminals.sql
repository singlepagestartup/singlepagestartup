CREATE TABLE "sps_cm_input" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"type" text DEFAULT 'default' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"title" jsonb DEFAULT '{}'::jsonb,
	"subtitle" jsonb DEFAULT '{}'::jsonb,
	"description" jsonb DEFAULT '{}'::jsonb,
	"class_name" text,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_cm_input_slug_unique" UNIQUE("slug")
);
