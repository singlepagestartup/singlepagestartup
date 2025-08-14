CREATE TABLE "bg_ws_to_cs_b03" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"cy_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bg_ws_to_cs_b03" ADD CONSTRAINT "bg_ws_to_cs_b03_wt_id_sps_blog_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_blog_widget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bg_ws_to_cs_b03" ADD CONSTRAINT "bg_ws_to_cs_b03_cy_id_sps_blog_category_id_fk" FOREIGN KEY ("cy_id") REFERENCES "public"."sps_blog_category"("id") ON DELETE cascade ON UPDATE no action;