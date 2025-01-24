CREATE TABLE "sps_bg_invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"payment_url" text DEFAULT '' NOT NULL,
	"success_url" text DEFAULT '' NOT NULL,
	"cancel_url" text DEFAULT '' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"provider_id" text,
	"provider" text DEFAULT 'stripe'
);
