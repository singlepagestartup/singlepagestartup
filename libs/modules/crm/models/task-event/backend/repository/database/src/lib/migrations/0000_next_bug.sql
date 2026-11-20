CREATE TABLE "sps_cm_task_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"task_id" uuid NOT NULL,
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
CREATE UNIQUE INDEX "cm_task_event_revision" ON "sps_cm_task_event" USING btree ("task_id","revision");--> statement-breakpoint
CREATE UNIQUE INDEX "cm_task_event_operation" ON "sps_cm_task_event" USING btree ("task_id","operation_key");