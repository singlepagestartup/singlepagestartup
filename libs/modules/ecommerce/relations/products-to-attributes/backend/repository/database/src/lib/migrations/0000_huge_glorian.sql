CREATE TABLE "sps_ee_ps_to_as_c2s" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pt_id" uuid NOT NULL,
	"ae_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_ps_to_as_c2s" ADD CONSTRAINT "sps_ee_ps_to_as_c2s_pt_id_sps_ee_product_id_fk" FOREIGN KEY ("pt_id") REFERENCES "public"."sps_ee_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_ps_to_as_c2s" ADD CONSTRAINT "sps_ee_ps_to_as_c2s_ae_id_sps_ee_attribute_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sps_ee_attribute"("id") ON DELETE cascade ON UPDATE no action;