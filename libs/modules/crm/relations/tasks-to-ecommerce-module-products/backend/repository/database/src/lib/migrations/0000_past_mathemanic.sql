CREATE TABLE "sps_cm_tasks_to_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"task_id" uuid NOT NULL,
	"product_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_products" ADD CONSTRAINT "sps_cm_tasks_to_products_task_id_sps_cm_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_products" ADD CONSTRAINT "sps_cm_tasks_to_products_product_id_sps_ee_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."sps_ee_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_products_owner" ON "sps_cm_tasks_to_products" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "cm_tasks_to_products_target" ON "sps_cm_tasks_to_products" USING btree ("product_id");