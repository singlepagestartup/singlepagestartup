CREATE TABLE "sps_ee_ws_to_ss_cv3" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"se_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_ws_to_ss_cv3" ADD CONSTRAINT "sps_ee_ws_to_ss_cv3_wt_id_sps_ee_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_ee_widget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_ws_to_ss_cv3" ADD CONSTRAINT "sps_ee_ws_to_ss_cv3_se_id_sps_ee_store_id_fk" FOREIGN KEY ("se_id") REFERENCES "public"."sps_ee_store"("id") ON DELETE cascade ON UPDATE no action;