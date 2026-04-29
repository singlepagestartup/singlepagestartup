CREATE TABLE "sl_ts_to_as_4vv" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"td_id" uuid NOT NULL,
	"ac_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_ts_to_as_4vv" ADD CONSTRAINT "sl_ts_to_as_4vv_td_id_sl_thread_id_fk" FOREIGN KEY ("td_id") REFERENCES "public"."sl_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ts_to_as_4vv" ADD CONSTRAINT "sl_ts_to_as_4vv_ac_id_sl_action_id_fk" FOREIGN KEY ("ac_id") REFERENCES "public"."sl_action"("id") ON DELETE cascade ON UPDATE no action;