CREATE TABLE IF NOT EXISTS "sl_ps_to_we_br_me_ws_q0l" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"we_br_me_wt_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sl_ps_to_we_br_me_ws_q0l" ADD CONSTRAINT "sl_ps_to_we_br_me_ws_q0l_pe_id_sl_profile_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sl_profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sl_ps_to_we_br_me_ws_q0l" ADD CONSTRAINT "sl_ps_to_we_br_me_ws_q0l_we_br_me_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("we_br_me_wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;