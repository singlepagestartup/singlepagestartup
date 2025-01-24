CREATE TABLE "sps_w_b_fs_to_ss_fe_se_me_ws_idk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"fe_id" uuid NOT NULL,
	"sps_fe_se_me_fe_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_w_b_fs_to_ss_fe_se_me_ws_idk" ADD CONSTRAINT "sps_w_b_fs_to_ss_fe_se_me_ws_idk_fe_id_sps_w_b_feature_id_fk" FOREIGN KEY ("fe_id") REFERENCES "public"."sps_w_b_feature"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_w_b_fs_to_ss_fe_se_me_ws_idk" ADD CONSTRAINT "sps_w_b_fs_to_ss_fe_se_me_ws_idk_sps_fe_se_me_fe_id_sps_f_s_widget_id_fk" FOREIGN KEY ("sps_fe_se_me_fe_id") REFERENCES "public"."sps_f_s_widget"("id") ON DELETE cascade ON UPDATE no action;