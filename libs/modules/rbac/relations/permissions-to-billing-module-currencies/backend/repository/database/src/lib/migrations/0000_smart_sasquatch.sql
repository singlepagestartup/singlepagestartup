CREATE TABLE "sps_rc_ps_to_bg_me_cs_b24" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"amount" text DEFAULT '0' NOT NULL,
	"pn_id" uuid NOT NULL,
	"bg_me_cy_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_rc_ps_to_bg_me_cs_b24" ADD CONSTRAINT "sps_rc_ps_to_bg_me_cs_b24_pn_id_sps_rc_permission_id_fk" FOREIGN KEY ("pn_id") REFERENCES "public"."sps_rc_permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_ps_to_bg_me_cs_b24" ADD CONSTRAINT "sps_rc_ps_to_bg_me_cs_b24_bg_me_cy_id_sps_bg_currency_id_fk" FOREIGN KEY ("bg_me_cy_id") REFERENCES "public"."sps_bg_currency"("id") ON DELETE cascade ON UPDATE no action;