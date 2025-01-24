CREATE TABLE "sps_rc_rs_to_ee_me_ps_cv3" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"re_id" uuid NOT NULL,
	"ee_me_pt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_rc_rs_to_ee_me_ps_cv3" ADD CONSTRAINT "sps_rc_rs_to_ee_me_ps_cv3_re_id_sps_rc_role_id_fk" FOREIGN KEY ("re_id") REFERENCES "public"."sps_rc_role"("id") ON DELETE cascade ON UPDATE no action;