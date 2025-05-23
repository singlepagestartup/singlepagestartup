CREATE TABLE "sps_rc_rs_to_as_mz2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"re_id" uuid NOT NULL,
	"an_id" uuid NOT NULL,
	"condition" text
);
--> statement-breakpoint
ALTER TABLE "sps_rc_rs_to_as_mz2" ADD CONSTRAINT "sps_rc_rs_to_as_mz2_re_id_sps_rc_role_id_fk" FOREIGN KEY ("re_id") REFERENCES "public"."sps_rc_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_rs_to_as_mz2" ADD CONSTRAINT "sps_rc_rs_to_as_mz2_an_id_sps_rc_action_id_fk" FOREIGN KEY ("an_id") REFERENCES "public"."sps_rc_action"("id") ON DELETE cascade ON UPDATE no action;