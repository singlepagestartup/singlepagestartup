CREATE TABLE "sl_thread_to_crm_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"thread_id" uuid NOT NULL,
	"crm_task_id" uuid NOT NULL,
	"consultation_task_id" uuid,
	CONSTRAINT "sl_thread_to_crm_task_thread_id_unique" UNIQUE("thread_id"),
	CONSTRAINT "sl_thread_to_crm_task_crm_task_id_unique" UNIQUE("crm_task_id")
);
--> statement-breakpoint
ALTER TABLE "sl_thread_to_crm_task" ADD CONSTRAINT "sl_thread_to_crm_task_thread_id_sl_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."sl_thread"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_thread_to_crm_task" ADD CONSTRAINT "sl_thread_to_crm_task_crm_task_id_sps_cm_task_id_fk" FOREIGN KEY ("crm_task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_thread_to_crm_task" ADD CONSTRAINT "sl_thread_to_crm_task_consultation_task_id_sps_cm_task_id_fk" FOREIGN KEY ("consultation_task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE restrict ON UPDATE no action;