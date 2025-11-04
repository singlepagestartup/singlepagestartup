CREATE TABLE "ee_cs_to_we_br_me_ws_bfm" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"cy_id" uuid NOT NULL,
	"wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ee_cs_to_we_br_me_ws_bfm" ADD CONSTRAINT "ee_cs_to_we_br_me_ws_bfm_cy_id_sps_ee_category_id_fk" FOREIGN KEY ("cy_id") REFERENCES "public"."sps_ee_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ee_cs_to_we_br_me_ws_bfm" ADD CONSTRAINT "ee_cs_to_we_br_me_ws_bfm_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;