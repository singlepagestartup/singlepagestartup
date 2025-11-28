CREATE TABLE "sl_cs_to_ms_e6r" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ct_id" uuid NOT NULL,
	"me_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_cs_to_ms_e6r" ADD CONSTRAINT "sl_cs_to_ms_e6r_ct_id_sl_widget_id_fk" FOREIGN KEY ("ct_id") REFERENCES "public"."sl_widget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_cs_to_ms_e6r" ADD CONSTRAINT "sl_cs_to_ms_e6r_me_id_sl_message_id_fk" FOREIGN KEY ("me_id") REFERENCES "public"."sl_message"("id") ON DELETE cascade ON UPDATE no action;