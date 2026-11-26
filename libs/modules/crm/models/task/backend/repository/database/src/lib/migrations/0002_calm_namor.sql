DROP INDEX "cm_task_store_order";--> statement-breakpoint
CREATE INDEX "cm_task_store_order_lookup" ON "sps_cm_task" USING btree ("store_id","order_id") WHERE "sps_cm_task"."order_id" is not null;