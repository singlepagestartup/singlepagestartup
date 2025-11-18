CREATE TABLE "sl_cs_to_ts_v33" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ct_id" uuid NOT NULL,
	"td_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_cs_to_ts_v33" ADD CONSTRAINT "sl_cs_to_ts_v33_ct_id_sl_chat_id_fk" FOREIGN KEY ("ct_id") REFERENCES "public"."sl_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_cs_to_ts_v33" ADD CONSTRAINT "sl_cs_to_ts_v33_td_id_sl_tread_id_fk" FOREIGN KEY ("td_id") REFERENCES "public"."sl_tread"("id") ON DELETE cascade ON UPDATE no action;