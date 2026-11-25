DROP INDEX "cm_funnels_to_tasks_funnel";--> statement-breakpoint
DROP INDEX "cm_funnels_to_tasks_task";--> statement-breakpoint
ALTER TABLE "sps_cm_funnels_to_tasks" ADD COLUMN "variant" text DEFAULT 'primary' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_funnels_to_tasks_pair" ON "sps_cm_funnels_to_tasks" USING btree ("funnel_id","task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cm_funnels_to_tasks_primary" ON "sps_cm_funnels_to_tasks" USING btree ("task_id") WHERE "sps_cm_funnels_to_tasks"."variant" = 'primary';--> statement-breakpoint
CREATE INDEX "cm_funnels_to_tasks_task" ON "sps_cm_funnels_to_tasks" USING btree ("task_id");--> statement-breakpoint
ALTER TABLE "sps_cm_funnels_to_tasks" ADD CONSTRAINT "cm_funnels_to_tasks_variant" CHECK ("sps_cm_funnels_to_tasks"."variant" in ('primary', 'related'));