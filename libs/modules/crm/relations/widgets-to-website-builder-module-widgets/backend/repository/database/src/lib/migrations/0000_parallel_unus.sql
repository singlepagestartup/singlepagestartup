CREATE TABLE "sps_cm_ws_to_we_br_me_ws_n52" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"we_br_me_wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_ws_to_we_br_me_ws_n52" ADD CONSTRAINT "sps_cm_ws_to_we_br_me_ws_n52_wt_id_sps_cm_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_cm_widget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_ws_to_we_br_me_ws_n52" ADD CONSTRAINT "sps_cm_ws_to_we_br_me_ws_n52_we_br_me_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("we_br_me_wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;