CREATE TABLE "sl_ps_to_ke_me_ds_gch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"ke_me_dt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_ps_to_ke_me_ds_gch" ADD CONSTRAINT "sl_ps_to_ke_me_ds_gch_pe_id_sl_profile_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sl_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ps_to_ke_me_ds_gch" ADD CONSTRAINT "sl_ps_to_ke_me_ds_gch_ke_me_dt_id_sps_ke_document_id_fk" FOREIGN KEY ("ke_me_dt_id") REFERENCES "public"."sps_ke_document"("id") ON DELETE cascade ON UPDATE no action;