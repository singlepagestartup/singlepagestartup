ALTER TABLE "sps_nn_topic" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_nn_topic" ADD CONSTRAINT "sps_nn_topic_slug_unique" UNIQUE("slug");