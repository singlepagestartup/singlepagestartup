DELETE FROM "sps_bt_message";--> statement-breakpoint
ALTER TABLE "sps_bt_message" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '1 hour';--> statement-breakpoint
ALTER TABLE "sps_bt_message" ALTER COLUMN "expires_at" SET NOT NULL;