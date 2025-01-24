CREATE TABLE "sps_bg_pt_is_to_cs_cg0" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pt_it_id" uuid NOT NULL,
	"cy_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_bg_pt_is_to_cs_cg0" ADD CONSTRAINT "sps_bg_pt_is_to_cs_cg0_pt_it_id_sps_bg_pt_it_id_fk" FOREIGN KEY ("pt_it_id") REFERENCES "public"."sps_bg_pt_it"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_bg_pt_is_to_cs_cg0" ADD CONSTRAINT "sps_bg_pt_is_to_cs_cg0_cy_id_sps_bg_currency_id_fk" FOREIGN KEY ("cy_id") REFERENCES "public"."sps_bg_currency"("id") ON DELETE cascade ON UPDATE no action;