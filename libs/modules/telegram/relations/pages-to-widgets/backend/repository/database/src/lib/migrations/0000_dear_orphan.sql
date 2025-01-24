CREATE TABLE "sps_tm_ps_to_ws_v3d" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"pe_id" uuid NOT NULL,
	"wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_tm_ps_to_ws_v3d" ADD CONSTRAINT "sps_tm_ps_to_ws_v3d_pe_id_sps_tm_page_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sps_tm_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_tm_ps_to_ws_v3d" ADD CONSTRAINT "sps_tm_ps_to_ws_v3d_wt_id_sps_tm_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_tm_widget"("id") ON DELETE cascade ON UPDATE no action;