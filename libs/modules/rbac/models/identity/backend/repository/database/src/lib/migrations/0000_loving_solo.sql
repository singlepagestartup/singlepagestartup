CREATE TABLE IF NOT EXISTS "sps_rc_identity" (
	"password" text,
	"salt" text,
	"account" text,
	"email" text,
	"provider" text DEFAULT 'email_and_password' NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL
);
