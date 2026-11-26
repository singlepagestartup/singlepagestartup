DROP INDEX "cm_task_opening";--> statement-breakpoint
DROP INDEX "cm_task_store_updated";--> statement-breakpoint
DROP INDEX "cm_task_store_funnel_updated";--> statement-breakpoint
DROP INDEX "cm_task_store_stage_updated";--> statement-breakpoint
DROP INDEX "cm_task_store_funnel_stage_updated";--> statement-breakpoint
DROP INDEX "cm_task_store_customer_updated";--> statement-breakpoint
DROP INDEX "cm_task_store_order_lookup";--> statement-breakpoint
DROP INDEX "cm_task_store_due";--> statement-breakpoint
CREATE INDEX "cm_task_opening_key" ON "sps_cm_task" USING btree ("opening_key");--> statement-breakpoint
CREATE INDEX "cm_task_updated" ON "sps_cm_task" USING btree ("updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "cm_task_stage_updated" ON "sps_cm_task" USING btree ("stage_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "sps_cm_task" DROP COLUMN "store_id";--> statement-breakpoint
ALTER TABLE "sps_cm_task" DROP COLUMN "funnel_id";--> statement-breakpoint
ALTER TABLE "sps_cm_task" DROP COLUMN "publication_id";--> statement-breakpoint
ALTER TABLE "sps_cm_task" DROP COLUMN "customer_id";--> statement-breakpoint
ALTER TABLE "sps_cm_task" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "sps_cm_task" DROP COLUMN "offer_id";--> statement-breakpoint
ALTER TABLE "sps_cm_task" DROP COLUMN "order_id";--> statement-breakpoint
ALTER TABLE "sps_cm_task" DROP COLUMN "assignee_id";