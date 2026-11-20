CREATE TABLE "sps_cm_funnels_to_stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"funnel_id" uuid NOT NULL,
	"store_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_funnels_to_stores" ADD CONSTRAINT "sps_cm_funnels_to_stores_funnel_id_sps_cm_funnel_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."sps_cm_funnel"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_funnels_to_stores" ADD CONSTRAINT "sps_cm_funnels_to_stores_store_id_sps_ee_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sps_ee_store"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_funnels_to_stores_owner" ON "sps_cm_funnels_to_stores" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "cm_funnels_to_stores_target" ON "sps_cm_funnels_to_stores" USING btree ("store_id");