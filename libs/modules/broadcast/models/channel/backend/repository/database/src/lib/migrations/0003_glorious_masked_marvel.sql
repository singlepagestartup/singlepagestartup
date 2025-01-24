ALTER TABLE "sps_bt_channel" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';
ALTER TABLE "sps_bt_channel" ALTER COLUMN "admin_title" SET NOT NULL;