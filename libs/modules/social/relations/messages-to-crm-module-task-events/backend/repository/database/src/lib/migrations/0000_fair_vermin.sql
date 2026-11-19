CREATE TABLE "sl_message_to_crm_task_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"message_id" uuid NOT NULL,
	"crm_task_event_id" uuid NOT NULL,
	"pending" boolean DEFAULT false NOT NULL,
	CONSTRAINT "sl_message_to_crm_task_event_message_id_unique" UNIQUE("message_id"),
	CONSTRAINT "sl_message_to_crm_task_event_crm_task_event_id_unique" UNIQUE("crm_task_event_id")
);
--> statement-breakpoint
ALTER TABLE "sl_message_to_crm_task_event" ADD CONSTRAINT "sl_message_to_crm_task_event_message_id_sl_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."sl_message"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_message_to_crm_task_event" ADD CONSTRAINT "sl_message_to_crm_task_event_crm_task_event_id_sps_cm_task_event_id_fk" FOREIGN KEY ("crm_task_event_id") REFERENCES "public"."sps_cm_task_event"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sl_pending_crm_message" ON "sl_message_to_crm_task_event" USING btree ("pending","created_at");