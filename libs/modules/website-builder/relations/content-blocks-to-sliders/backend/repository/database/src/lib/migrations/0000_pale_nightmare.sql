CREATE TABLE IF NOT EXISTS "sps_w_b_ct_bs_to_ss" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ct_bk_id" uuid NOT NULL,
	"sr_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_w_b_ct_bs_to_ss" ADD CONSTRAINT "sps_w_b_ct_bs_to_ss_ct_bk_id_sps_w_b_ct_bs_c2s_id_fk" FOREIGN KEY ("ct_bk_id") REFERENCES "public"."sps_w_b_ct_bs_c2s"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_w_b_ct_bs_to_ss" ADD CONSTRAINT "sps_w_b_ct_bs_to_ss_sr_id_sps_w_b_slider_id_fk" FOREIGN KEY ("sr_id") REFERENCES "public"."sps_w_b_slider"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;