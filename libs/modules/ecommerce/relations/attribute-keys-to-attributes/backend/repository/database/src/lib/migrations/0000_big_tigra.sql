CREATE TABLE IF NOT EXISTS "sps_ee_ae_ks_to_as_v3g" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ae_ky_id" uuid NOT NULL,
	"ae_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_ee_ae_ks_to_as_v3g" ADD CONSTRAINT "sps_ee_ae_ks_to_as_v3g_ae_ky_id_sps_ee_ae_ky_id_fk" FOREIGN KEY ("ae_ky_id") REFERENCES "public"."sps_ee_ae_ky"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_ee_ae_ks_to_as_v3g" ADD CONSTRAINT "sps_ee_ae_ks_to_as_v3g_ae_id_sps_ee_attribute_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sps_ee_attribute"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;