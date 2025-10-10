CREATE TABLE "sl_ms_to_fe_se_me_fs_3v0" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"me_id" uuid NOT NULL,
	"fe_se_me_fe_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_ms_to_fe_se_me_fs_3v0" ADD CONSTRAINT "sl_ms_to_fe_se_me_fs_3v0_me_id_sl_message_id_fk" FOREIGN KEY ("me_id") REFERENCES "public"."sl_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ms_to_fe_se_me_fs_3v0" ADD CONSTRAINT "sl_ms_to_fe_se_me_fs_3v0_fe_se_me_fe_id_sps_f_s_file_id_fk" FOREIGN KEY ("fe_se_me_fe_id") REFERENCES "public"."sps_f_s_file"("id") ON DELETE cascade ON UPDATE no action;