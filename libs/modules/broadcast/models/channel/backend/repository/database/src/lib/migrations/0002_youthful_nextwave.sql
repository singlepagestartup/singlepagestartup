DELETE FROM "sps_bt_channel";
ALTER TABLE "sps_bt_channel" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_bt_channel" ADD CONSTRAINT "sps_bt_channel_slug_unique" UNIQUE("slug");