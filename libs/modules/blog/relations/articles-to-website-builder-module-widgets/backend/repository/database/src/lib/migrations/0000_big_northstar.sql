CREATE TABLE "sps_blog_as_to_we_br_me_wt_v5b" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ae_id" uuid NOT NULL,
	"we_br_me_wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_blog_as_to_we_br_me_wt_v5b" ADD CONSTRAINT "sps_blog_as_to_we_br_me_wt_v5b_ae_id_sps_blog_article_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sps_blog_article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_blog_as_to_we_br_me_wt_v5b" ADD CONSTRAINT "sps_blog_as_to_we_br_me_wt_v5b_we_br_me_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("we_br_me_wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;