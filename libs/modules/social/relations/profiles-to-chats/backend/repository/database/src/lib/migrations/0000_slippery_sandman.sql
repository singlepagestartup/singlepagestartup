CREATE TABLE "sl_ps_to_cs_m2s" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"ct_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_ps_to_cs_m2s" ADD CONSTRAINT "sl_ps_to_cs_m2s_pe_id_sl_profile_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sl_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ps_to_cs_m2s" ADD CONSTRAINT "sl_ps_to_cs_m2s_ct_id_sl_widget_id_fk" FOREIGN KEY ("ct_id") REFERENCES "public"."sl_widget"("id") ON DELETE cascade ON UPDATE no action;