ALTER TABLE "sps_bt_cs_to_ms_34z" ADD COLUMN "feed_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_bt_cs_to_ms_34z" ADD COLUMN "delivery_key" text;--> statement-breakpoint
ALTER TABLE "sps_bt_cs_to_ms_34z" ADD COLUMN "receipt" text;--> statement-breakpoint
ALTER TABLE "sps_bt_cs_to_ms_34z" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sps_bt_cs_to_ms_34z" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sps_bt_cs_to_ms_34z" ADD COLUMN "lease_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sps_bt_cs_to_ms_34z" ADD COLUMN "finished_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "bt_channel_message_lookup" ON "sps_bt_cs_to_ms_34z" USING btree ("cl_id","me_id");--> statement-breakpoint
CREATE INDEX "bt_message_channel_cleanup" ON "sps_bt_cs_to_ms_34z" USING btree ("me_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bt_delivery_channel_key" ON "sps_bt_cs_to_ms_34z" USING btree ("cl_id","delivery_key") WHERE "sps_bt_cs_to_ms_34z"."delivery_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "bt_delivery_owner" ON "sps_bt_cs_to_ms_34z" USING btree ("me_id") WHERE "sps_bt_cs_to_ms_34z"."delivery_key" is not null;--> statement-breakpoint
CREATE INDEX "bt_delivery_pending" ON "sps_bt_cs_to_ms_34z" USING btree ("cl_id","created_at","me_id") WHERE "sps_bt_cs_to_ms_34z"."delivery_key" is not null and "sps_bt_cs_to_ms_34z"."finished_at" is null;--> statement-breakpoint
CREATE INDEX "bt_delivery_leases" ON "sps_bt_cs_to_ms_34z" USING btree ("cl_id","lease_until") WHERE "sps_bt_cs_to_ms_34z"."delivery_key" is not null and "sps_bt_cs_to_ms_34z"."finished_at" is null and "sps_bt_cs_to_ms_34z"."lease_until" is not null;--> statement-breakpoint
CREATE INDEX "bt_delivery_completed" ON "sps_bt_cs_to_ms_34z" USING btree ("cl_id","finished_at","me_id") WHERE "sps_bt_cs_to_ms_34z"."delivery_key" is not null and "sps_bt_cs_to_ms_34z"."finished_at" is not null;