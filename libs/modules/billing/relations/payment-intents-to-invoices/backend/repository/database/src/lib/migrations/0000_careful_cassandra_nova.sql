CREATE TABLE IF NOT EXISTS "sps_bg_pt_is_to_is_lbb" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pt_it_id" uuid NOT NULL,
	"ie_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_bg_pt_is_to_is_lbb" ADD CONSTRAINT "sps_bg_pt_is_to_is_lbb_pt_it_id_sps_bg_pt_it_id_fk" FOREIGN KEY ("pt_it_id") REFERENCES "public"."sps_bg_pt_it"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_bg_pt_is_to_is_lbb" ADD CONSTRAINT "sps_bg_pt_is_to_is_lbb_ie_id_sps_bg_invoice_id_fk" FOREIGN KEY ("ie_id") REFERENCES "public"."sps_bg_invoice"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
