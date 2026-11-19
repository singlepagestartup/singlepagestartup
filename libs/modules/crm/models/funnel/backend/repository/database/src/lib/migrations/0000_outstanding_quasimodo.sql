CREATE TABLE "sps_cm_funnel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"definition" jsonb NOT NULL,
	"bindings" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"published_version" integer
);
--> statement-breakpoint
CREATE INDEX "cm_funnel_store_updated" ON "sps_cm_funnel" USING btree ("store_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "cm_funnel_store_kind" ON "sps_cm_funnel" USING btree ("store_id","kind");