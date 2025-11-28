ALTER TABLE "rc_action" ADD COLUMN "payload" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "rc_action" ADD COLUMN "expires_at" timestamp DEFAULT NOW() + INTERVAL '1 month' NOT NULL;--> statement-breakpoint