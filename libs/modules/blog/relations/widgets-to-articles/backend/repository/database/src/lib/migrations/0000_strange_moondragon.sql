CREATE TABLE "bg_ws_to_as_y18" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"ae_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bg_ws_to_as_y18" ADD CONSTRAINT "bg_ws_to_as_y18_wt_id_sps_blog_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_blog_widget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bg_ws_to_as_y18" ADD CONSTRAINT "bg_ws_to_as_y18_ae_id_sps_blog_article_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sps_blog_article"("id") ON DELETE cascade ON UPDATE no action;