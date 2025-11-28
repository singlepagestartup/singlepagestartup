CREATE TABLE "rc_action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb
);
DROP TABLE IF EXISTS "rc_act" CASCADE;