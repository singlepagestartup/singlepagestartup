CREATE TABLE IF NOT EXISTS "sps_w_b_fs_to_ws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"fr_id" uuid NOT NULL,
	"wt_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_w_b_fs_to_ws" ADD CONSTRAINT "sps_w_b_fs_to_ws_fr_id_sps_w_b_footers_id_fk" FOREIGN KEY ("fr_id") REFERENCES "public"."sps_w_b_footers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_w_b_fs_to_ws" ADD CONSTRAINT "sps_w_b_fs_to_ws_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
