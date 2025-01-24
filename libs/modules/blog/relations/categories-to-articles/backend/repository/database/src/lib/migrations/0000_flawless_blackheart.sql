CREATE TABLE "sps_blog_cs_to_as_d3r" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"cy_id" uuid NOT NULL,
	"ae_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_blog_cs_to_as_d3r" ADD CONSTRAINT "sps_blog_cs_to_as_d3r_cy_id_sps_blog_category_id_fk" FOREIGN KEY ("cy_id") REFERENCES "public"."sps_blog_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_blog_cs_to_as_d3r" ADD CONSTRAINT "sps_blog_cs_to_as_d3r_ae_id_sps_blog_article_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sps_blog_article"("id") ON DELETE cascade ON UPDATE no action;