ALTER TABLE "sps_ee_order" ADD COLUMN "subscription_period_starts_at" timestamp;--> statement-breakpoint
ALTER TABLE "sps_ee_order" ADD COLUMN "subscription_period_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "sps_ee_order" ADD COLUMN "subscription_period_invoice_id" uuid;