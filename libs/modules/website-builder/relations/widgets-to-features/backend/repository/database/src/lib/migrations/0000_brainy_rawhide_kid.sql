CREATE TABLE "sps_w_b_ws_to_fs_c2d" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"fe_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_w_b_ws_to_fs_c2d" ADD CONSTRAINT "sps_w_b_ws_to_fs_c2d_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_w_b_ws_to_fs_c2d" ADD CONSTRAINT "sps_w_b_ws_to_fs_c2d_fe_id_sps_w_b_feature_id_fk" FOREIGN KEY ("fe_id") REFERENCES "public"."sps_w_b_feature"("id") ON DELETE cascade ON UPDATE no action;