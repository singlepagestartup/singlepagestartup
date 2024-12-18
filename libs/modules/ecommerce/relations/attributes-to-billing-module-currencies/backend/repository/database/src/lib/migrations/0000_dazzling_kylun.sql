CREATE TABLE IF NOT EXISTS "sps_ee_as_to_bg_me_cs_6bg" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ae_id" uuid NOT NULL,
	"bg_me_cy_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_ee_as_to_bg_me_cs_6bg" ADD CONSTRAINT "sps_ee_as_to_bg_me_cs_6bg_ae_id_sps_ee_attribute_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sps_ee_attribute"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_ee_as_to_bg_me_cs_6bg" ADD CONSTRAINT "sps_ee_as_to_bg_me_cs_6bg_bg_me_cy_id_sps_bg_currency_id_fk" FOREIGN KEY ("bg_me_cy_id") REFERENCES "public"."sps_bg_currency"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
