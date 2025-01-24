CREATE TABLE "sps_w_b_ss_to_ss" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"sr_id" uuid NOT NULL,
	"se_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_w_b_ss_to_ss" ADD CONSTRAINT "sps_w_b_ss_to_ss_sr_id_sps_w_b_slider_id_fk" FOREIGN KEY ("sr_id") REFERENCES "public"."sps_w_b_slider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_w_b_ss_to_ss" ADD CONSTRAINT "sps_w_b_ss_to_ss_se_id_sps_w_b_slide_id_fk" FOREIGN KEY ("se_id") REFERENCES "public"."sps_w_b_slide"("id") ON DELETE cascade ON UPDATE no action;