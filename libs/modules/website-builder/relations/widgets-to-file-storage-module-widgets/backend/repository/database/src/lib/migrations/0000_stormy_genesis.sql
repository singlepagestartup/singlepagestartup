CREATE TABLE "sps_w_b_ws_to_ss_fe_se_ws_abs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"sps_fe_se_wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_w_b_ws_to_ss_fe_se_ws_abs" ADD CONSTRAINT "sps_w_b_ws_to_ss_fe_se_ws_abs_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_w_b_ws_to_ss_fe_se_ws_abs" ADD CONSTRAINT "sps_w_b_ws_to_ss_fe_se_ws_abs_sps_fe_se_wt_id_sps_f_s_widget_id_fk" FOREIGN KEY ("sps_fe_se_wt_id") REFERENCES "public"."sps_f_s_widget"("id") ON DELETE cascade ON UPDATE no action;