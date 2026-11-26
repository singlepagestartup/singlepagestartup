DROP INDEX "cm_tasks_to_stages_revision";--> statement-breakpoint
DROP INDEX "cm_tasks_to_stages_operation";--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_stages" ADD COLUMN "variant" text DEFAULT 'history' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_stages_state" ON "sps_cm_tasks_to_stages" USING btree ("task_id","stage_id") WHERE "sps_cm_tasks_to_stages"."variant" <> 'history';--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_stages_current" ON "sps_cm_tasks_to_stages" USING btree ("task_id") WHERE "sps_cm_tasks_to_stages"."variant" = 'current';--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_stages_revision" ON "sps_cm_tasks_to_stages" USING btree ("task_id","revision") WHERE "sps_cm_tasks_to_stages"."variant" = 'history';--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_stages_operation" ON "sps_cm_tasks_to_stages" USING btree ("task_id","operation_key") WHERE "sps_cm_tasks_to_stages"."variant" = 'history';