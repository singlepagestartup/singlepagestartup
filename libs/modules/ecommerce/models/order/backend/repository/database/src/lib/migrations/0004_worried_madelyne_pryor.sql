ALTER TABLE "sps_ee_order" ADD COLUMN "subscription_source_order_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_ee_order" ADD COLUMN "subscription_source_invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_ee_order" ADD COLUMN "subscription_source_interval" text;--> statement-breakpoint
CREATE UNIQUE INDEX "sps_ee_order_subscription_next_period_unique" ON "sps_ee_order" USING btree ("subscription_source_order_id","subscription_source_invoice_id");