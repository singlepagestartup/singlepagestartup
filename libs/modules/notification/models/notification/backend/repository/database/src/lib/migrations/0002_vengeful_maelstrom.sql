-- delete everything in table
DELETE FROM "sps_nn_notification";
ALTER TABLE "sps_nn_notification" ALTER COLUMN "data" SET DATA TYPE jsonb USING "data"::jsonb;--> statement-breakpoint
ALTER TABLE "sps_nn_notification" ALTER COLUMN "data" SET DEFAULT '{}'::jsonb;
