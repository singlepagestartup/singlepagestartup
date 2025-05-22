CREATE TABLE "sl_ae_ky" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"type" text DEFAULT 'feature' NOT NULL,
	"field" text DEFAULT 'string' NOT NULL,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	"title" jsonb DEFAULT '{}'::jsonb,
	"prefix" jsonb DEFAULT '{}'::jsonb,
	"suffix" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "sl_ae_ky_slug_unique" UNIQUE("slug")
);
