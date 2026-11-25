CREATE TABLE "sps_cm_tasks_to_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"task_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"status" text NOT NULL,
	"comment" text,
	"revision" integer NOT NULL,
	"assignment_revision" integer NOT NULL,
	"kind" text NOT NULL,
	"actor_id" uuid,
	"actor_kind" text,
	"cause_id" text,
	"operation_key" text NOT NULL,
	"operation_digest" text NOT NULL,
	"detail" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_stages" ADD CONSTRAINT "sps_cm_tasks_to_stages_task_id_sps_cm_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_stages" ADD CONSTRAINT "sps_cm_tasks_to_stages_stage_id_sps_cm_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."sps_cm_stage"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_stages_revision" ON "sps_cm_tasks_to_stages" USING btree ("task_id","revision");--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_stages_operation" ON "sps_cm_tasks_to_stages" USING btree ("task_id","operation_key");