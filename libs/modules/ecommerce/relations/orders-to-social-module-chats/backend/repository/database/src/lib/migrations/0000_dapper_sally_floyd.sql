CREATE TABLE "sps_ee_os_to_sl_me_cs_lg2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"or_id" uuid NOT NULL,
	"sl_me_ct_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_sl_me_cs_lg2" ADD CONSTRAINT "sps_ee_os_to_sl_me_cs_lg2_or_id_sps_ee_order_id_fk" FOREIGN KEY ("or_id") REFERENCES "public"."sps_ee_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_sl_me_cs_lg2" ADD CONSTRAINT "sps_ee_os_to_sl_me_cs_lg2_sl_me_ct_id_sl_chat_id_fk" FOREIGN KEY ("sl_me_ct_id") REFERENCES "public"."sl_chat"("id") ON DELETE cascade ON UPDATE no action;