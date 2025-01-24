CREATE TABLE "sps_ee_ps_to_fe_se_me_ws_3cv" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pt_id" uuid NOT NULL,
	"fe_se_me_wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_ps_to_fe_se_me_ws_3cv" ADD CONSTRAINT "sps_ee_ps_to_fe_se_me_ws_3cv_pt_id_sps_ee_product_id_fk" FOREIGN KEY ("pt_id") REFERENCES "public"."sps_ee_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_ps_to_fe_se_me_ws_3cv" ADD CONSTRAINT "sps_ee_ps_to_fe_se_me_ws_3cv_fe_se_me_wt_id_sps_f_s_widget_id_fk" FOREIGN KEY ("fe_se_me_wt_id") REFERENCES "public"."sps_f_s_widget"("id") ON DELETE cascade ON UPDATE no action;