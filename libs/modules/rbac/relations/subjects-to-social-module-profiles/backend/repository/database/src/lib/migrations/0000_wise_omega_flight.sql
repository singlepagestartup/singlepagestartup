CREATE TABLE "rc_ss_to_sl_me_ps_ges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"st_id" uuid NOT NULL,
	"sl_me_pe_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rc_ss_to_sl_me_ps_ges" ADD CONSTRAINT "rc_ss_to_sl_me_ps_ges_st_id_sps_rc_subject_id_fk" FOREIGN KEY ("st_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_ss_to_sl_me_ps_ges" ADD CONSTRAINT "rc_ss_to_sl_me_ps_ges_sl_me_pe_id_sl_profile_id_fk" FOREIGN KEY ("sl_me_pe_id") REFERENCES "public"."sl_profile"("id") ON DELETE cascade ON UPDATE no action;