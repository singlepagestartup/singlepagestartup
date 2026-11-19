CREATE TABLE "sps_cm_funnel_publication" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"funnel_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"draft_revision" integer NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"definition" jsonb NOT NULL,
	"bindings" jsonb NOT NULL,
	"actor_id" uuid NOT NULL,
	"operation_key" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cm_funnel_publication_version" ON "sps_cm_funnel_publication" USING btree ("funnel_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "cm_funnel_publication_draft" ON "sps_cm_funnel_publication" USING btree ("funnel_id","draft_revision");--> statement-breakpoint
CREATE UNIQUE INDEX "cm_funnel_publication_operation" ON "sps_cm_funnel_publication" USING btree ("funnel_id","operation_key");