ALTER TABLE "sps_rc_identity" ADD COLUMN "usage" text DEFAULT 'inbound' NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_rc_identity" ADD CONSTRAINT "sps_rc_identity_provider_purpose" CHECK (
      ("sps_rc_identity"."usage" = 'inbound' AND "sps_rc_identity"."provider" NOT IN ('openai','openrouter'))
      OR ("sps_rc_identity"."usage" = 'outbound_api' AND "sps_rc_identity"."provider" IN ('openai','openrouter')
      AND "sps_rc_identity"."password" IS NULL AND "sps_rc_identity"."salt" IS NULL AND "sps_rc_identity"."code" IS NULL
      AND "sps_rc_identity"."email" IS NULL AND "sps_rc_identity"."account" IS NULL));