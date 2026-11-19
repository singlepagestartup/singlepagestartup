DROP INDEX "sps_agent_work_event_capability";--> statement-breakpoint
ALTER TABLE "sps_agent_work_attempt" ADD COLUMN "step_key" text DEFAULT 'reply' NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_agent_work_attempt" ADD COLUMN "request_digest" text;--> statement-breakpoint
ALTER TABLE "sps_agent_work_attempt" ADD COLUMN "publication_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "sps_agent_work_event_step" ON "sps_agent_work_attempt" USING btree ("store_id","task_id","event_id","capability","step_key");