CREATE TABLE "sps_ee_product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"type" text DEFAULT 'one_off' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"short_description" text DEFAULT '',
	"sku" text NOT NULL,
	CONSTRAINT "sps_ee_product_sku_unique" UNIQUE("sku")
);
