CREATE TABLE "sl_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"class_name" text,
	"variant" text DEFAULT 'default' NOT NULL,
	"title" text,
	"description" text,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sl_thread_slug_unique" UNIQUE("slug")
);
