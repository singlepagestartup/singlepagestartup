CREATE TABLE "sps_ee_cs_to_ps_d4v" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"cy_id" uuid NOT NULL,
	"pt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_cs_to_ps_d4v" ADD CONSTRAINT "sps_ee_cs_to_ps_d4v_cy_id_sps_ee_category_id_fk" FOREIGN KEY ("cy_id") REFERENCES "public"."sps_ee_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_cs_to_ps_d4v" ADD CONSTRAINT "sps_ee_cs_to_ps_d4v_pt_id_sps_ee_product_id_fk" FOREIGN KEY ("pt_id") REFERENCES "public"."sps_ee_product"("id") ON DELETE cascade ON UPDATE no action;