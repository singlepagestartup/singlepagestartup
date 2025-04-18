CREATE TABLE "sps_w_b_modal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"title" text,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_w_b_modal_slug_unique" UNIQUE("slug")
);
