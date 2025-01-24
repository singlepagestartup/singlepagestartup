CREATE TABLE "sps_ee_attribute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"string" text,
	"number" numeric,
	"boolean" boolean,
	"date" timestamp,
	"datetime" timestamp
);
