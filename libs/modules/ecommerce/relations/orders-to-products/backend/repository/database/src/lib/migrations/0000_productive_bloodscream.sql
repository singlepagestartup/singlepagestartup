CREATE TABLE "sps_ee_os_to_ps_d4c" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"class_name" text,
	"or_id" uuid NOT NULL,
	"pt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_ps_d4c" ADD CONSTRAINT "sps_ee_os_to_ps_d4c_or_id_sps_ee_order_id_fk" FOREIGN KEY ("or_id") REFERENCES "public"."sps_ee_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_ps_d4c" ADD CONSTRAINT "sps_ee_os_to_ps_d4c_pt_id_sps_ee_product_id_fk" FOREIGN KEY ("pt_id") REFERENCES "public"."sps_ee_product"("id") ON DELETE cascade ON UPDATE no action;