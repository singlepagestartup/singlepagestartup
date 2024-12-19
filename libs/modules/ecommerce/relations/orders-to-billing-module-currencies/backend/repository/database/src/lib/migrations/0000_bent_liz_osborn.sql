CREATE TABLE IF NOT EXISTS "sps_ee_os_to_bg_me_cs_b33" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"class_name" text,
	"or_id" uuid NOT NULL,
	"bg_me_cy_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_ee_os_to_bg_me_cs_b33" ADD CONSTRAINT "sps_ee_os_to_bg_me_cs_b33_or_id_sps_ee_order_id_fk" FOREIGN KEY ("or_id") REFERENCES "public"."sps_ee_order"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_ee_os_to_bg_me_cs_b33" ADD CONSTRAINT "sps_ee_os_to_bg_me_cs_b33_bg_me_cy_id_sps_bg_currency_id_fk" FOREIGN KEY ("bg_me_cy_id") REFERENCES "public"."sps_bg_currency"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
