CREATE TABLE "sl_chat_to_crm_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"chat_id" uuid NOT NULL,
	"crm_task_id" uuid NOT NULL,
	"consultation_task_id" uuid,
	"memory_project_id" uuid
);
--> statement-breakpoint
ALTER TABLE "sl_chat_to_crm_task" ADD CONSTRAINT "sl_chat_to_crm_task_chat_id_sl_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."sl_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_chat_to_crm_task" ADD CONSTRAINT "sl_chat_to_crm_task_crm_task_id_sps_cm_task_id_fk" FOREIGN KEY ("crm_task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_chat_to_crm_task" ADD CONSTRAINT "sl_chat_to_crm_task_consultation_task_id_sps_cm_task_id_fk" FOREIGN KEY ("consultation_task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_chat_to_crm_task" ADD CONSTRAINT "sl_chat_to_crm_task_memory_project_id_sl_thread_id_fk" FOREIGN KEY ("memory_project_id") REFERENCES "public"."sl_thread"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sl_chat_task_pair" ON "sl_chat_to_crm_task" USING btree ("chat_id","crm_task_id");--> statement-breakpoint
CREATE INDEX "sl_task_chat_lookup" ON "sl_chat_to_crm_task" USING btree ("crm_task_id");