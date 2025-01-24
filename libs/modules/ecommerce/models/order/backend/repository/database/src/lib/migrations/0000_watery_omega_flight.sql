CREATE TABLE "sps_ee_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"type" text DEFAULT 'cart' NOT NULL,
	"receipt" text DEFAULT '' NOT NULL,
	"comment" text
);
