CREATE TABLE "sps_cm_stage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"configuration" jsonb NOT NULL
);
