CREATE TABLE "sl_pe_to_ee_me_ps_4b2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"ee_me_pt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" ADD CONSTRAINT "sl_pe_to_ee_me_ps_4b2_pe_id_sl_profile_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sl_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" ADD CONSTRAINT "sl_pe_to_ee_me_ps_4b2_ee_me_pt_id_sps_ee_product_id_fk" FOREIGN KEY ("ee_me_pt_id") REFERENCES "public"."sps_ee_product"("id") ON DELETE cascade ON UPDATE no action;