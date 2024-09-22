CREATE TABLE IF NOT EXISTS "sps_nn_ts_to_ns_v8d" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"tc_id" uuid NOT NULL,
	"nn_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_nn_ts_to_ns_v8d" ADD CONSTRAINT "sps_nn_ts_to_ns_v8d_tc_id_sps_nn_topic_id_fk" FOREIGN KEY ("tc_id") REFERENCES "public"."sps_nn_topic"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_nn_ts_to_ns_v8d" ADD CONSTRAINT "sps_nn_ts_to_ns_v8d_nn_id_sps_nn_notification_id_fk" FOREIGN KEY ("nn_id") REFERENCES "public"."sps_nn_notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
