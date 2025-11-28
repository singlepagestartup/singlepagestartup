CREATE TABLE "sps_tm_ws_to_el_ws_v3b" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"wt_id" uuid NOT NULL,
	"external_module" text DEFAULT 'website-builder' NOT NULL,
	"external_widget_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_tm_ws_to_el_ws_v3b" ADD CONSTRAINT "sps_tm_ws_to_el_ws_v3b_wt_id_sps_h_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_h_widget"("id") ON DELETE cascade ON UPDATE no action;