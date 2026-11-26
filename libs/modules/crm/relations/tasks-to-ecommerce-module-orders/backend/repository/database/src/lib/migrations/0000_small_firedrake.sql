CREATE TABLE "sps_cm_tasks_to_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"task_id" uuid NOT NULL,
	"order_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_orders" ADD CONSTRAINT "sps_cm_tasks_to_orders_task_id_sps_cm_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_orders" ADD CONSTRAINT "sps_cm_tasks_to_orders_order_id_sps_ee_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sps_ee_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_orders_owner" ON "sps_cm_tasks_to_orders" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "cm_tasks_to_orders_target" ON "sps_cm_tasks_to_orders" USING btree ("order_id");