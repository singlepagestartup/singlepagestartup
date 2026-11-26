CREATE TABLE "sps_agent_work_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"store_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"assignee_id" uuid NOT NULL,
	"assignment_revision" integer NOT NULL,
	"stage_id" text NOT NULL,
	"capability" text NOT NULL,
	"executor_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"currency_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"identity_id" uuid NOT NULL,
	"credential_version" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_account" text NOT NULL,
	"model" text NOT NULL,
	"terms" jsonb NOT NULL,
	"maximum" numeric(38, 12) NOT NULL,
	"state" text NOT NULL,
	"result" jsonb,
	"provider_request_id" text,
	"work_receipt_id" uuid,
	"expense_receipt_id" uuid
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sps_agent_work_event_capability" ON "sps_agent_work_attempt" USING btree ("store_id","task_id","event_id","capability");--> statement-breakpoint
CREATE INDEX "sps_agent_work_recovery" ON "sps_agent_work_attempt" USING btree ("state","updated_at");--> statement-breakpoint
CREATE INDEX "sps_agent_work_owner_task" ON "sps_agent_work_attempt" USING btree ("owner_id","store_id","task_id");