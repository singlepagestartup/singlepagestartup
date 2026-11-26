ALTER TABLE "sps_agent_work_attempt" ALTER COLUMN "executor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_agent_work_attempt" ALTER COLUMN "connection_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_agent_work_attempt" ALTER COLUMN "identity_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_agent_work_attempt" ALTER COLUMN "credential_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_agent_work_attempt" ADD COLUMN "provider_mode" text DEFAULT 'identity' NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_agent_work_attempt" ADD COLUMN "budget" jsonb;