ALTER TABLE "sps_f_s_widget" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';
ALTER TABLE "sps_f_s_widget" ALTER COLUMN "admin_title" SET NOT NULL;