DROP INDEX "sps_rc_subject_identity_identity_unique";--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD COLUMN "store_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD COLUMN "external_account" text;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD COLUMN "version" uuid;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD COLUMN "active" boolean;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD COLUMN "capability" text;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD COLUMN "terms" jsonb;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD CONSTRAINT "sps_rc_ss_to_is_h58_store_id_sps_ee_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sps_ee_store"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD CONSTRAINT "sps_rc_ss_to_is_h58_owner_id_sps_rc_subject_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sps_rc_identity_principal" ON "sps_rc_ss_to_is_h58" USING btree ("iy_id") WHERE "sps_rc_ss_to_is_h58"."variant" NOT IN ('provider-assignment', 'provider-default');--> statement-breakpoint
CREATE UNIQUE INDEX "sps_rc_provider_assistant_capability" ON "sps_rc_ss_to_is_h58" USING btree ("store_id","st_id","capability") WHERE "sps_rc_ss_to_is_h58"."variant" = 'provider-assignment';--> statement-breakpoint
CREATE UNIQUE INDEX "sps_rc_provider_default_capability" ON "sps_rc_ss_to_is_h58" USING btree ("store_id","capability") WHERE "sps_rc_ss_to_is_h58"."variant" = 'provider-default';--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD CONSTRAINT "sps_rc_identity_connection_fields" CHECK ("sps_rc_ss_to_is_h58"."variant" <> 'provider-connection' OR
      ("sps_rc_ss_to_is_h58"."store_id" IS NOT NULL AND "sps_rc_ss_to_is_h58"."owner_id" IS NOT NULL AND "sps_rc_ss_to_is_h58"."label" IS NOT NULL AND "sps_rc_ss_to_is_h58"."external_account" IS NOT NULL AND "sps_rc_ss_to_is_h58"."version" IS NOT NULL AND "sps_rc_ss_to_is_h58"."active" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD CONSTRAINT "sps_rc_identity_assignment_fields" CHECK ("sps_rc_ss_to_is_h58"."variant" NOT IN ('provider-assignment','provider-default') OR
      ("sps_rc_ss_to_is_h58"."store_id" IS NOT NULL AND "sps_rc_ss_to_is_h58"."capability" IS NOT NULL AND "sps_rc_ss_to_is_h58"."model" IS NOT NULL AND "sps_rc_ss_to_is_h58"."terms" IS NOT NULL));