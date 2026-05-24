CREATE TABLE "sps_ke_et_sn_wat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"class_name" text,
	"variant" text DEFAULT 'default' NOT NULL,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"target_document_id" uuid,
	"operation" text DEFAULT 'update' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"proposed_description" text DEFAULT '' NOT NULL,
	"rationale" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "sps_ke_et_sn_wat_slug_unique" UNIQUE("slug")
);
