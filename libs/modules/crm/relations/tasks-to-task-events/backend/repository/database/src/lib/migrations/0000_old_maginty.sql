CREATE TABLE "sps_cm_tasks_to_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"task_id" uuid NOT NULL,
	"event_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_events" ADD CONSTRAINT "sps_cm_tasks_to_events_task_id_sps_cm_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_events" ADD CONSTRAINT "sps_cm_tasks_to_events_event_id_sps_cm_task_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sps_cm_task_event"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_events_owner" ON "sps_cm_tasks_to_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "cm_tasks_to_events_target" ON "sps_cm_tasks_to_events" USING btree ("task_id");