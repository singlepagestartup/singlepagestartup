CREATE TABLE "rc_ws_to_cm_me_ws_l65" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"cm_me_wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rc_ws_to_cm_me_ws_l65" ADD CONSTRAINT "rc_ws_to_cm_me_ws_l65_wt_id_sps_rc_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_rc_widget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_ws_to_cm_me_ws_l65" ADD CONSTRAINT "rc_ws_to_cm_me_ws_l65_cm_me_wt_id_sps_cm_widget_id_fk" FOREIGN KEY ("cm_me_wt_id") REFERENCES "public"."sps_cm_widget"("id") ON DELETE cascade ON UPDATE no action;