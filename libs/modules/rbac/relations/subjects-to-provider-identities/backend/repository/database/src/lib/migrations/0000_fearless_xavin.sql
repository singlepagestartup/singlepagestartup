CREATE TABLE "sps_rc_subject_provider_identity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subject_id" uuid NOT NULL,
	"identity_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"label" text NOT NULL,
	"external_account" text NOT NULL,
	"version" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_rc_subject_provider_identity" ADD CONSTRAINT "sps_rc_subject_provider_identity_subject_id_sps_rc_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_subject_provider_identity" ADD CONSTRAINT "sps_rc_subject_provider_identity_identity_id_sps_rc_identity_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."sps_rc_identity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_subject_provider_identity" ADD CONSTRAINT "sps_rc_subject_provider_identity_owner_id_sps_rc_subject_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_subject_provider_identity" ADD CONSTRAINT "sps_rc_subject_provider_identity_store_id_sps_ee_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sps_ee_store"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sps_rc_outbound_identity_owner" ON "sps_rc_subject_provider_identity" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "sps_rc_provider_store" ON "sps_rc_subject_provider_identity" USING btree ("store_id","subject_id");