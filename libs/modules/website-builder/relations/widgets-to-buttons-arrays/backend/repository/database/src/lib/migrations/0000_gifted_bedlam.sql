CREATE TABLE "sps_w_b_ws_to_bs_as_pmd" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"by_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_w_b_ws_to_bs_as_pmd" ADD CONSTRAINT "sps_w_b_ws_to_bs_as_pmd_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_w_b_ws_to_bs_as_pmd" ADD CONSTRAINT "sps_w_b_ws_to_bs_as_pmd_by_id_sps_w_b_bs_ay_8m3_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."sps_w_b_bs_ay_8m3"("id") ON DELETE cascade ON UPDATE no action;