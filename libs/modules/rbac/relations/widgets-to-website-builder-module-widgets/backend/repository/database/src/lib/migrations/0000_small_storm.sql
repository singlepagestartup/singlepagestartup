CREATE TABLE "rc_ws_to_we_br_me_ws_em4" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"we_br_me_wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rc_ws_to_we_br_me_ws_em4" ADD CONSTRAINT "rc_ws_to_we_br_me_ws_em4_wt_id_sps_rc_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_rc_widget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_ws_to_we_br_me_ws_em4" ADD CONSTRAINT "rc_ws_to_we_br_me_ws_em4_we_br_me_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("we_br_me_wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;