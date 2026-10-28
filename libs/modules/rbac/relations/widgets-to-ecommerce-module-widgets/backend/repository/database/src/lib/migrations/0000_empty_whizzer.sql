CREATE TABLE "rc_ws_to_em_me_ws_c76" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"em_me_wt_id" uuid NOT NULL,
	CONSTRAINT "rc_ws_to_em_me_ws_c76_wt_id_em_me_wt_id_unique" UNIQUE("wt_id","em_me_wt_id")
);
--> statement-breakpoint
ALTER TABLE "rc_ws_to_em_me_ws_c76" ADD CONSTRAINT "rc_ws_to_em_me_ws_c76_wt_id_sps_rc_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_rc_widget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_ws_to_em_me_ws_c76" ADD CONSTRAINT "rc_ws_to_em_me_ws_c76_em_me_wt_id_sps_ee_widget_id_fk" FOREIGN KEY ("em_me_wt_id") REFERENCES "public"."sps_ee_widget"("id") ON DELETE cascade ON UPDATE no action;