CREATE TABLE "sps_rc_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"options" text DEFAULT '{}' NOT NULL
);
