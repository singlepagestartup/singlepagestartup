CREATE TABLE "sps_ee_os_to_fe_se_me_fs_b06" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"or_id" uuid NOT NULL,
	"fe_se_me_fe_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_fe_se_me_fs_b06" ADD CONSTRAINT "sps_ee_os_to_fe_se_me_fs_b06_or_id_sps_ee_order_id_fk" FOREIGN KEY ("or_id") REFERENCES "public"."sps_ee_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_fe_se_me_fs_b06" ADD CONSTRAINT "sps_ee_os_to_fe_se_me_fs_b06_fe_se_me_fe_id_sps_f_s_file_id_fk" FOREIGN KEY ("fe_se_me_fe_id") REFERENCES "public"."sps_f_s_file"("id") ON DELETE cascade ON UPDATE no action;