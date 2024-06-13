CREATE TABLE IF NOT EXISTS "sps_t_p_telegram" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"title" text NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
