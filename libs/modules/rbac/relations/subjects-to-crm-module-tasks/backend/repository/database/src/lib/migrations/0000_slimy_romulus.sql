CREATE TABLE "rc_subject_to_crm_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"subject_id" uuid NOT NULL,
	"crm_task_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rc_subject_to_crm_task" ADD CONSTRAINT "rc_subject_to_crm_task_subject_id_sps_rc_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_subject_to_crm_task" ADD CONSTRAINT "rc_subject_to_crm_task_crm_task_id_sps_cm_task_id_fk" FOREIGN KEY ("crm_task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rc_task_subject_role" ON "rc_subject_to_crm_task" USING btree ("crm_task_id","variant");--> statement-breakpoint
CREATE INDEX "rc_subject_tasks" ON "rc_subject_to_crm_task" USING btree ("subject_id","variant");