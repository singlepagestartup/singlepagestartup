CREATE TABLE "sps_ee_orders_to_order_works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_work_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_orders_to_order_works" ADD CONSTRAINT "sps_ee_orders_to_order_works_order_id_sps_ee_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sps_ee_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_orders_to_order_works" ADD CONSTRAINT "sps_ee_orders_to_order_works_order_work_id_sps_ee_order_work_id_fk" FOREIGN KEY ("order_work_id") REFERENCES "public"."sps_ee_order_work"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ee_orders_to_order_works_order" ON "sps_ee_orders_to_order_works" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ee_orders_to_order_works_work" ON "sps_ee_orders_to_order_works" USING btree ("order_work_id");