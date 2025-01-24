CREATE TABLE "sps_h_ls_to_ws_v2d" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"lt_id" uuid NOT NULL,
	"wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_h_ls_to_ws_v2d" ADD CONSTRAINT "sps_h_ls_to_ws_v2d_lt_id_sps_h_layout_id_fk" FOREIGN KEY ("lt_id") REFERENCES "public"."sps_h_layout"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_h_ls_to_ws_v2d" ADD CONSTRAINT "sps_h_ls_to_ws_v2d_wt_id_sps_h_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_h_widget"("id") ON DELETE cascade ON UPDATE no action;