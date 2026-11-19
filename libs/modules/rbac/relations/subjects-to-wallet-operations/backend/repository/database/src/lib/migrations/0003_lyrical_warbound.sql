ALTER TABLE "sps_rc_wallet_operation" ADD COLUMN "event_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_rc_wallet_operation" ADD COLUMN "run_budget" numeric(38, 12);