CREATE TABLE "ht_ma_to_fe_se_me_fs_5ax" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ma_id" uuid NOT NULL,
	"fe_se_me_fe_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ht_ma_to_fe_se_me_fs_5ax" ADD CONSTRAINT "ht_ma_to_fe_se_me_fs_5ax_ma_id_sps_h_metadata_id_fk" FOREIGN KEY ("ma_id") REFERENCES "public"."sps_h_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ht_ma_to_fe_se_me_fs_5ax" ADD CONSTRAINT "ht_ma_to_fe_se_me_fs_5ax_fe_se_me_fe_id_sps_f_s_file_id_fk" FOREIGN KEY ("fe_se_me_fe_id") REFERENCES "public"."sps_f_s_file"("id") ON DELETE cascade ON UPDATE no action;