CREATE TABLE "sps_h_ps_to_ws_xyv" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_h_ps_to_ws_xyv" ADD CONSTRAINT "sps_h_ps_to_ws_xyv_pe_id_sps_h_page_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sps_h_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_h_ps_to_ws_xyv" ADD CONSTRAINT "sps_h_ps_to_ws_xyv_wt_id_sps_h_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_h_widget"("id") ON DELETE cascade ON UPDATE no action;