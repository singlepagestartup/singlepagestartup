CREATE TABLE "sps_ee_offers_to_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'delivery' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"source_offer_id" uuid NOT NULL,
	"target_offer_id" uuid NOT NULL,
	"recurrence" text DEFAULT 'first' NOT NULL,
	CONSTRAINT "different_offers" CHECK ("sps_ee_offers_to_offers"."source_offer_id" <> "sps_ee_offers_to_offers"."target_offer_id"),
	CONSTRAINT "offer_link_variant" CHECK ("sps_ee_offers_to_offers"."variant" in ('delivery', 'add-on', 'fulfilled-by')),
	CONSTRAINT "offer_link_recurrence" CHECK ("sps_ee_offers_to_offers"."recurrence" in ('first', 'each'))
);
--> statement-breakpoint
ALTER TABLE "sps_ee_offers_to_offers" ADD CONSTRAINT "sps_ee_offers_to_offers_source_offer_id_sps_ee_ss_to_ps_vn7_id_fk" FOREIGN KEY ("source_offer_id") REFERENCES "public"."sps_ee_ss_to_ps_vn7"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_offers_to_offers" ADD CONSTRAINT "sps_ee_offers_to_offers_target_offer_id_sps_ee_ss_to_ps_vn7_id_fk" FOREIGN KEY ("target_offer_id") REFERENCES "public"."sps_ee_ss_to_ps_vn7"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ee_offer_link_target" ON "sps_ee_offers_to_offers" USING btree ("source_offer_id","variant","target_offer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ee_offer_fulfiller" ON "sps_ee_offers_to_offers" USING btree ("source_offer_id") WHERE "sps_ee_offers_to_offers"."variant" = 'fulfilled-by';