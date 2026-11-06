CREATE SCHEMA "sps_consistency";
--> statement-breakpoint
CREATE TABLE "sps_consistency"."delivery" (
	"sequence" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sps_consistency"."delivery_sequence_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event_id" text NOT NULL,
	"keys" jsonb NOT NULL,
	"versions" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "sps_consistency"."generation" (
	"key" text PRIMARY KEY NOT NULL,
	"version" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sps_consistency"."outbox" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"operation_id" text NOT NULL,
	"keys" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sps_consistency"."query" (
	"ref" text PRIMARY KEY NOT NULL,
	"identity" text NOT NULL,
	"auth" text NOT NULL,
	"dependencies" jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sps_consistency"."resource" (
	"resource" text PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"columns" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sps_consistency"."state" (
	"id" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "consistency_delivery_created" ON "sps_consistency"."delivery" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "consistency_outbox_pending" ON "sps_consistency"."outbox" USING btree ("processed","created_at");--> statement-breakpoint
CREATE INDEX "consistency_query_expiry" ON "sps_consistency"."query" USING btree ("expires_at");