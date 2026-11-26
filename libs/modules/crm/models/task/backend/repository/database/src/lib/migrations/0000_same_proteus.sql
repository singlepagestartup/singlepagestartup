CREATE TABLE "sps_cm_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"store_id" uuid NOT NULL,
	"funnel_id" uuid NOT NULL,
	"publication_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"product_id" uuid,
	"offer_id" uuid,
	"order_id" uuid,
	"stage_id" text NOT NULL,
	"status" text NOT NULL,
	"expected_event" text,
	"outcome" text,
	"revision" integer DEFAULT 1 NOT NULL,
	"assignee_id" uuid,
	"assignee_kind" text,
	"assignment_revision" integer DEFAULT 0 NOT NULL,
	"assignment_expires_at" timestamp (3),
	"waiting_revision" integer,
	"waiting_since" timestamp (3),
	"deadline_at" timestamp (3),
	"next_action_at" timestamp (3),
	"timer" jsonb,
	"opening_key" text NOT NULL,
	"opening_digest" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cm_task_opening" ON "sps_cm_task" USING btree ("store_id","opening_key");--> statement-breakpoint
CREATE INDEX "cm_task_store_updated" ON "sps_cm_task" USING btree ("store_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "cm_task_store_funnel_updated" ON "sps_cm_task" USING btree ("store_id","funnel_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "cm_task_store_stage_updated" ON "sps_cm_task" USING btree ("store_id","stage_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "cm_task_store_funnel_stage_updated" ON "sps_cm_task" USING btree ("store_id","funnel_id","stage_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "cm_task_store_customer_updated" ON "sps_cm_task" USING btree ("store_id","customer_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "cm_task_store_order" ON "sps_cm_task" USING btree ("store_id","order_id") WHERE "sps_cm_task"."order_id" is not null;--> statement-breakpoint
CREATE INDEX "cm_task_store_due" ON "sps_cm_task" USING btree ("store_id","next_action_at","id") WHERE "sps_cm_task"."status" = 'waiting';