CREATE TABLE "sps_w_b_ss_to_fe_se_me_fs_ekr" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"se_id" uuid NOT NULL,
	"fe_se_me_fe_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_w_b_ss_to_fe_se_me_fs_ekr" ADD CONSTRAINT "sps_w_b_ss_to_fe_se_me_fs_ekr_se_id_sps_w_b_slide_id_fk" FOREIGN KEY ("se_id") REFERENCES "public"."sps_w_b_slide"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_w_b_ss_to_fe_se_me_fs_ekr" ADD CONSTRAINT "sps_w_b_ss_to_fe_se_me_fs_ekr_fe_se_me_fe_id_sps_f_s_file_id_fk" FOREIGN KEY ("fe_se_me_fe_id") REFERENCES "public"."sps_f_s_file"("id") ON DELETE cascade ON UPDATE no action;