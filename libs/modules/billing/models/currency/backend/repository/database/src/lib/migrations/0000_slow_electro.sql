CREATE TABLE "sps_bg_currency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"symbol" text NOT NULL,
	"title" text NOT NULL,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_bg_currency_slug_unique" UNIQUE("slug")
);
