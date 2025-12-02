CREATE TABLE "sl_action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '1 month' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb
);
