CREATE TABLE "sps_cm_funnels_to_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"funnel_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_funnels_to_offers" ADD CONSTRAINT "sps_cm_funnels_to_offers_funnel_id_sps_cm_funnel_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."sps_cm_funnel"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_funnels_to_offers" ADD CONSTRAINT "sps_cm_funnels_to_offers_offer_id_sps_ee_ss_to_ps_vn7_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."sps_ee_ss_to_ps_vn7"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_funnels_to_offers_pair" ON "sps_cm_funnels_to_offers" USING btree ("funnel_id","offer_id");--> statement-breakpoint
CREATE INDEX "cm_funnels_to_offers_offer" ON "sps_cm_funnels_to_offers" USING btree ("offer_id");