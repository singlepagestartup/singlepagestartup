ALTER TABLE "sps_cm_funnel" ADD COLUMN "slug" text;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_funnel_store_slug" ON "sps_cm_funnel" USING btree ("store_id","slug");