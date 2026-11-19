CREATE TABLE "sps_ee_order_work" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"order_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"state" text NOT NULL,
	"versions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"decisions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"accepted_version_id" uuid,
	"paid" jsonb,
	"delivered_at" timestamp (3),
	"receipt_file_id" uuid,
	"result_file_id" uuid,
	"paid_dispatched_at" timestamp (3),
	"fulfillment" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ee_order_work_order" ON "sps_ee_order_work" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "ee_order_work_customer" ON "sps_ee_order_work" USING btree ("customer_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "ee_order_work_payment_outbox" ON "sps_ee_order_work" USING btree ("updated_at","id") WHERE "sps_ee_order_work"."paid" is not null and "sps_ee_order_work"."paid_dispatched_at" is null;