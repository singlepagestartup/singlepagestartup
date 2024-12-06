ALTER TABLE "sps_nn_widget" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "sps_nn_widget" ADD CONSTRAINT "sps_nn_widget_slug_unique" UNIQUE("slug");