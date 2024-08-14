CREATE TABLE IF NOT EXISTS "sps_w_b_nr_bs_to_bs_as_njg" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"position" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"nk_id" uuid NOT NULL,
	"by_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_w_b_nr_bs_to_bs_as_njg" ADD CONSTRAINT "sps_w_b_nr_bs_to_bs_as_njg_nk_id_sps_w_b_nr_bk_id_fk" FOREIGN KEY ("nk_id") REFERENCES "public"."sps_w_b_nr_bk"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_w_b_nr_bs_to_bs_as_njg" ADD CONSTRAINT "sps_w_b_nr_bs_to_bs_as_njg_by_id_sps_w_b_bs_ay_8m3_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."sps_w_b_bs_ay_8m3"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;