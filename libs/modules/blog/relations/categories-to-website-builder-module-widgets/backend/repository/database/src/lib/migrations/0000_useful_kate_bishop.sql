CREATE TABLE "sps_blog_cs_to_we_br_me_wt_7d2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"cy_id" uuid NOT NULL,
	"we_br_me_wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_blog_cs_to_we_br_me_wt_7d2" ADD CONSTRAINT "sps_blog_cs_to_we_br_me_wt_7d2_cy_id_sps_blog_category_id_fk" FOREIGN KEY ("cy_id") REFERENCES "public"."sps_blog_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_blog_cs_to_we_br_me_wt_7d2" ADD CONSTRAINT "sps_blog_cs_to_we_br_me_wt_7d2_we_br_me_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("we_br_me_wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;