CREATE TABLE "sps_ee_ps_to_we_br_me_ws_v3w" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pt_id" uuid NOT NULL,
	"wt_br_me_wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_ps_to_we_br_me_ws_v3w" ADD CONSTRAINT "sps_ee_ps_to_we_br_me_ws_v3w_pt_id_sps_ee_product_id_fk" FOREIGN KEY ("pt_id") REFERENCES "public"."sps_ee_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_ps_to_we_br_me_ws_v3w" ADD CONSTRAINT "sps_ee_ps_to_we_br_me_ws_v3w_wt_br_me_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("wt_br_me_wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;