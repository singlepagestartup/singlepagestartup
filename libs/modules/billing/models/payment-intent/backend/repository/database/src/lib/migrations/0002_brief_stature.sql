ALTER TABLE "sps_bg_pt_it" ADD COLUMN "checkout_provider" text;--> statement-breakpoint
ALTER TABLE "sps_bg_pt_it" ADD COLUMN "checkout_currency_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_bg_pt_it" ADD COLUMN "checkout_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "sps_bg_pt_it" ADD COLUMN "checkout_dispatch_state" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_bg_pt_it" ADD COLUMN "checkout_dispatch_started_at" timestamp;