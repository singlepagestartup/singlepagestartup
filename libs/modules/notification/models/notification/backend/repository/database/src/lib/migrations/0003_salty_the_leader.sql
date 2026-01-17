DELETE FROM "sps_nn_notification";
ALTER TABLE "sps_nn_notification" ALTER COLUMN "attachments" SET DATA TYPE jsonb USING "attachments"::jsonb;--> statement-breakpoint
ALTER TABLE "sps_nn_notification" ALTER COLUMN "attachments" SET DEFAULT '[]'::jsonb;
