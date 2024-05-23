CREATE TABLE IF NOT EXISTS "sps_w_b_ws_to_ss_3bx" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"direction" text DEFAULT 'default' NOT NULL,
	"wt_id" uuid NOT NULL,
	"se_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_w_b_ws_to_ss_3bx" ADD CONSTRAINT "sps_w_b_ws_to_ss_3bx_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_w_b_ws_to_ss_3bx" ADD CONSTRAINT "sps_w_b_ws_to_ss_3bx_se_id_sps_w_b_slide_id_fk" FOREIGN KEY ("se_id") REFERENCES "public"."sps_w_b_slide"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
