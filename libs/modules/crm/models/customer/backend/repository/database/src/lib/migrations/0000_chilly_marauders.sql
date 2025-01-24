CREATE TABLE "sps_cm_customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"email" text DEFAULT '',
	"first_name" text DEFAULT '',
	"last_name" text DEFAULT '',
	"phone" text DEFAULT ''
);
