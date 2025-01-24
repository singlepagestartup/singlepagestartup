CREATE TABLE "sps_blog_as_to_fe_se_me_wt_d24" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ae_id" uuid NOT NULL,
	"fe_se_me_wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_blog_as_to_fe_se_me_wt_d24" ADD CONSTRAINT "sps_blog_as_to_fe_se_me_wt_d24_ae_id_sps_blog_article_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sps_blog_article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_blog_as_to_fe_se_me_wt_d24" ADD CONSTRAINT "sps_blog_as_to_fe_se_me_wt_d24_fe_se_me_wt_id_sps_f_s_widget_id_fk" FOREIGN KEY ("fe_se_me_wt_id") REFERENCES "public"."sps_f_s_widget"("id") ON DELETE cascade ON UPDATE no action;