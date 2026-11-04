CREATE TABLE "sl_ps_to_ke_me_ss_gch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"ke_me_se_id" uuid NOT NULL,
	CONSTRAINT "sl_profile_source_unique" UNIQUE("pe_id","ke_me_se_id")
);
--> statement-breakpoint
ALTER TABLE "sl_ps_to_ke_me_ss_gch" ADD CONSTRAINT "sl_ps_to_ke_me_ss_gch_pe_id_sl_profile_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sl_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ps_to_ke_me_ss_gch" ADD CONSTRAINT "sl_ps_to_ke_me_ss_gch_ke_me_se_id_sps_ke_source_id_fk" FOREIGN KEY ("ke_me_se_id") REFERENCES "public"."sps_ke_source"("id") ON DELETE cascade ON UPDATE no action;