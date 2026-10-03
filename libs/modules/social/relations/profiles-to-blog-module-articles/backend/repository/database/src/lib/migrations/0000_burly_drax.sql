CREATE TABLE "sl_ps_to_bg_me_as" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"bg_me_ae_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_ps_to_bg_me_as" ADD CONSTRAINT "sl_ps_to_bg_me_as_pe_id_sl_profile_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sl_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ps_to_bg_me_as" ADD CONSTRAINT "sl_ps_to_bg_me_as_bg_me_ae_id_sps_blog_article_id_fk" FOREIGN KEY ("bg_me_ae_id") REFERENCES "public"."sps_blog_article"("id") ON DELETE cascade ON UPDATE no action;