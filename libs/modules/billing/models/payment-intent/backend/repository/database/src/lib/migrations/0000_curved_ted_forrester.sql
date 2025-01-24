CREATE TABLE "sps_bg_pt_it" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'requires_payment_method' NOT NULL,
	"interval" text,
	"type" text DEFAULT 'one_off' NOT NULL
);
