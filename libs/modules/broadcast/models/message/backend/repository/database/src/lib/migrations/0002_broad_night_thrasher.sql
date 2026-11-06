ALTER TABLE "sps_bt_message" ALTER COLUMN "expires_at" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "bt_durable_message_cleanup" ON "sps_bt_message" USING btree ("id") WHERE "sps_bt_message"."expires_at" is null;--> statement-breakpoint
CREATE INDEX "bt_message_expiry" ON "sps_bt_message" USING btree ("expires_at") WHERE "sps_bt_message"."expires_at" is not null;