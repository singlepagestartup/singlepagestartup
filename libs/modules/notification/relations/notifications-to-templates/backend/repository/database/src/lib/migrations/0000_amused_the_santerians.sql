CREATE TABLE IF NOT EXISTS "sps_nn_ns_to_ts_g3c" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"nn_id" uuid NOT NULL,
	"te_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_nn_ns_to_ts_g3c" ADD CONSTRAINT "sps_nn_ns_to_ts_g3c_nn_id_sps_nn_notification_id_fk" FOREIGN KEY ("nn_id") REFERENCES "public"."sps_nn_notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_nn_ns_to_ts_g3c" ADD CONSTRAINT "sps_nn_ns_to_ts_g3c_te_id_sps_nn_template_id_fk" FOREIGN KEY ("te_id") REFERENCES "public"."sps_nn_template"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
