CREATE TABLE "sl_cs_to_fe_se_me_fs_d7x" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ct_id" uuid NOT NULL,
	"fe_se_me_fe_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_cs_to_fe_se_me_fs_d7x" ADD CONSTRAINT "sl_cs_to_fe_se_me_fs_d7x_ct_id_sl_chat_id_fk" FOREIGN KEY ("ct_id") REFERENCES "public"."sl_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_cs_to_fe_se_me_fs_d7x" ADD CONSTRAINT "sl_cs_to_fe_se_me_fs_d7x_fe_se_me_fe_id_sps_f_s_file_id_fk" FOREIGN KEY ("fe_se_me_fe_id") REFERENCES "public"."sps_f_s_file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sl_chat_cover_file" ON "sl_cs_to_fe_se_me_fs_d7x" USING btree ("ct_id") WHERE "sl_cs_to_fe_se_me_fs_d7x"."variant" = 'cover';