CREATE TABLE "sps_cm_funnels_to_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"funnel_id" uuid NOT NULL,
	"task_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_funnels_to_tasks" ADD CONSTRAINT "sps_cm_funnels_to_tasks_funnel_id_sps_cm_funnel_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."sps_cm_funnel"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_funnels_to_tasks" ADD CONSTRAINT "sps_cm_funnels_to_tasks_task_id_sps_cm_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_funnels_to_tasks_task" ON "sps_cm_funnels_to_tasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "cm_funnels_to_tasks_funnel" ON "sps_cm_funnels_to_tasks" USING btree ("funnel_id");