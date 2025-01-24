UPDATE "sps_nn_widget"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_nn_widget" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_nn_widget" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "sps_nn_widget" ADD COLUMN "admin_title" text NOT NULL;