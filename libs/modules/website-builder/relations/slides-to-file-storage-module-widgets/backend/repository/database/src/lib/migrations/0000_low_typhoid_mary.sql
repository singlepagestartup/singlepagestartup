CREATE TABLE "sps_w_b_ss_to_ss_fe_se_ws_ekr" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"se_id" uuid NOT NULL,
	"sps_fe_se_wt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_w_b_ss_to_ss_fe_se_ws_ekr" ADD CONSTRAINT "sps_w_b_ss_to_ss_fe_se_ws_ekr_se_id_sps_w_b_slide_id_fk" FOREIGN KEY ("se_id") REFERENCES "public"."sps_w_b_slide"("id") ON DELETE cascade ON UPDATE no action;