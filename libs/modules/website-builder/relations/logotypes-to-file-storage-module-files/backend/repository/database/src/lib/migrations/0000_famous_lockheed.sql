CREATE TABLE "sps_w_b_ls_to_fe_se_me_fs_uas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"le_id" uuid NOT NULL,
	"fe_se_me_fe_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_w_b_ls_to_fe_se_me_fs_uas" ADD CONSTRAINT "sps_w_b_ls_to_fe_se_me_fs_uas_le_id_sps_w_b_logotype_id_fk" FOREIGN KEY ("le_id") REFERENCES "public"."sps_w_b_logotype"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_w_b_ls_to_fe_se_me_fs_uas" ADD CONSTRAINT "sps_w_b_ls_to_fe_se_me_fs_uas_fe_se_me_fe_id_sps_f_s_file_id_fk" FOREIGN KEY ("fe_se_me_fe_id") REFERENCES "public"."sps_f_s_file"("id") ON DELETE cascade ON UPDATE no action;