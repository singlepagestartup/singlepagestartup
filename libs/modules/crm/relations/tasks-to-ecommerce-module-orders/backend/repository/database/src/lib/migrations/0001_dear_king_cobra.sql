DROP INDEX "cm_tasks_to_orders_owner";--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_orders_pair" ON "sps_cm_tasks_to_orders" USING btree ("task_id","order_id");