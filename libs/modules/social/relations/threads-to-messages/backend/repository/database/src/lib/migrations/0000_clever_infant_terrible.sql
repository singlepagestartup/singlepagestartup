CREATE TABLE "sl_ts_to_ms_2n4" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"td_id" uuid NOT NULL,
	"me_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_ts_to_ms_2n4" ADD CONSTRAINT "sl_ts_to_ms_2n4_td_id_sl_thread_id_fk" FOREIGN KEY ("td_id") REFERENCES "public"."sl_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ts_to_ms_2n4" ADD CONSTRAINT "sl_ts_to_ms_2n4_me_id_sl_message_id_fk" FOREIGN KEY ("me_id") REFERENCES "public"."sl_message"("id") ON DELETE cascade ON UPDATE no action;