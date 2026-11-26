DROP INDEX "cm_tasks_to_offers_owner";--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_offers_pair" ON "sps_cm_tasks_to_offers" USING btree ("task_id","offer_id");