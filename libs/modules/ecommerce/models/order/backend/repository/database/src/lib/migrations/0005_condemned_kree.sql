ALTER TABLE "sps_ee_order" ADD COLUMN "subscription_scheduled_starts_at" timestamp;--> statement-breakpoint
ALTER TABLE "sps_ee_order" ADD COLUMN "subscription_scheduled_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "sps_ee_order" ADD COLUMN "subscription_provider_invoice_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "sps_ee_order_subscription_provider_invoice_unique" ON "sps_ee_order" USING btree ("subscription_provider_invoice_id");