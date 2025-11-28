CREATE TABLE "bg_as_to_ee_me_ps_bd9" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ae_id" uuid NOT NULL,
	"pt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bg_as_to_ee_me_ps_bd9" ADD CONSTRAINT "bg_as_to_ee_me_ps_bd9_ae_id_sps_blog_article_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sps_blog_article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bg_as_to_ee_me_ps_bd9" ADD CONSTRAINT "bg_as_to_ee_me_ps_bd9_pt_id_sps_ee_product_id_fk" FOREIGN KEY ("pt_id") REFERENCES "public"."sps_ee_product"("id") ON DELETE cascade ON UPDATE no action;