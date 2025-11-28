CREATE TABLE "sl_ps_to_fe_se_me_fs_u5o" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"fe_se_me_fe_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_ps_to_fe_se_me_fs_u5o" ADD CONSTRAINT "sl_ps_to_fe_se_me_fs_u5o_pe_id_sl_profile_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sl_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ps_to_fe_se_me_fs_u5o" ADD CONSTRAINT "sl_ps_to_fe_se_me_fs_u5o_fe_se_me_fe_id_sps_f_s_file_id_fk" FOREIGN KEY ("fe_se_me_fe_id") REFERENCES "public"."sps_f_s_file"("id") ON DELETE cascade ON UPDATE no action;