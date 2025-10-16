CREATE TABLE "cm_os_to_fs_se_me_fe_gwo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"on_id" uuid NOT NULL,
	"fe_se_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cm_os_to_fs_se_me_fe_gwo" ADD CONSTRAINT "cm_os_to_fs_se_me_fe_gwo_on_id_sps_cm_option_id_fk" FOREIGN KEY ("on_id") REFERENCES "public"."sps_cm_option"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cm_os_to_fs_se_me_fe_gwo" ADD CONSTRAINT "cm_os_to_fs_se_me_fe_gwo_fe_se_id_sps_f_s_file_id_fk" FOREIGN KEY ("fe_se_id") REFERENCES "public"."sps_f_s_file"("id") ON DELETE cascade ON UPDATE no action;