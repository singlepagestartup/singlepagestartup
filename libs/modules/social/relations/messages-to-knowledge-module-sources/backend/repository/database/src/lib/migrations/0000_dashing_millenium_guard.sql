CREATE TABLE "sl_ms_to_ke_me_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"kind" text DEFAULT 'origin' NOT NULL,
	"message_id" uuid NOT NULL,
	"ke_me_se_id" uuid NOT NULL,
	CONSTRAINT "sl_message_source_unique" UNIQUE("message_id","ke_me_se_id","kind")
);
--> statement-breakpoint
ALTER TABLE "sl_ms_to_ke_me_sources" ADD CONSTRAINT "sl_ms_to_ke_me_sources_message_id_sl_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."sl_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ms_to_ke_me_sources" ADD CONSTRAINT "sl_ms_to_ke_me_sources_ke_me_se_id_sps_ke_source_id_fk" FOREIGN KEY ("ke_me_se_id") REFERENCES "public"."sps_ke_source"("id") ON DELETE cascade ON UPDATE no action;