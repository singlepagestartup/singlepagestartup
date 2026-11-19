CREATE TABLE "sps_rc_subject_provider_agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subject_id" uuid NOT NULL,
	"executor_id" uuid NOT NULL,
	"identity_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"capability" text NOT NULL,
	"model" text NOT NULL,
	"terms" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_rc_subject_provider_agent" ADD CONSTRAINT "sps_rc_subject_provider_agent_subject_id_sps_rc_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_subject_provider_agent" ADD CONSTRAINT "sps_rc_subject_provider_agent_executor_id_sps_rc_subject_id_fk" FOREIGN KEY ("executor_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_subject_provider_agent" ADD CONSTRAINT "sps_rc_subject_provider_agent_identity_id_sps_rc_identity_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."sps_rc_identity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_subject_provider_agent" ADD CONSTRAINT "sps_rc_subject_provider_agent_store_id_sps_ee_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sps_ee_store"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sps_rc_agent_provider_capability" ON "sps_rc_subject_provider_agent" USING btree ("store_id","subject_id","capability");