CREATE TABLE "sps_agent_agent" (
	"title" text NOT NULL,
	"admin_title" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"slug" text NOT NULL,
	"interval" text,
	CONSTRAINT "sps_agent_agent_slug_unique" UNIQUE("slug")
);
