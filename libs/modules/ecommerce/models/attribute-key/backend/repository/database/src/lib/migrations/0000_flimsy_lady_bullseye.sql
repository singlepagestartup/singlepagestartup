CREATE TABLE "sps_ee_ae_ky" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"type" text DEFAULT 'feature' NOT NULL,
	"field" text DEFAULT 'string' NOT NULL,
	"title" text NOT NULL,
	"prefix" text,
	"suffix" text,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_ee_ae_ky_slug_unique" UNIQUE("slug")
);
