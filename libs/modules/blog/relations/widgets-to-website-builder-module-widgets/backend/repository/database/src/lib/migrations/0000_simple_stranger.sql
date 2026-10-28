CREATE TABLE "sps_blog_ws_to_we_br_me_ws_c76" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"we_br_me_wt_id" uuid NOT NULL,
	CONSTRAINT "sps_blog_ws_to_we_br_me_ws_c76_wt_id_we_br_me_wt_id_unique" UNIQUE("wt_id","we_br_me_wt_id")
);
--> statement-breakpoint
ALTER TABLE "sps_blog_ws_to_we_br_me_ws_c76" ADD CONSTRAINT "sps_blog_ws_to_we_br_me_ws_c76_wt_id_sps_blog_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_blog_widget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_blog_ws_to_we_br_me_ws_c76" ADD CONSTRAINT "sps_blog_ws_to_we_br_me_ws_c76_we_br_me_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("we_br_me_wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;