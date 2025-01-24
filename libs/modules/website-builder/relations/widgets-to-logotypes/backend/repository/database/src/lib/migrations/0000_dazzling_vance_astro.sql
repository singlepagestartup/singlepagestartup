CREATE TABLE "sps_w_b_ws_to_ls_pbd" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"le_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_w_b_ws_to_ls_pbd" ADD CONSTRAINT "sps_w_b_ws_to_ls_pbd_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_w_b_ws_to_ls_pbd" ADD CONSTRAINT "sps_w_b_ws_to_ls_pbd_le_id_sps_w_b_logotype_id_fk" FOREIGN KEY ("le_id") REFERENCES "public"."sps_w_b_logotype"("id") ON DELETE cascade ON UPDATE no action;