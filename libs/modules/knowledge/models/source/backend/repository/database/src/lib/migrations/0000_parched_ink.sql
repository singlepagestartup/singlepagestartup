CREATE TABLE "sps_ke_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"class_name" text,
	"variant" text DEFAULT 'default' NOT NULL,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'document' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"description" text,
	"original_path" text NOT NULL,
	"content_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_indexed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "sps_ke_source_slug_unique" UNIQUE("slug"),
	CONSTRAINT "sps_ke_source_original_path_unique" UNIQUE("original_path")
);
--> statement-breakpoint
CREATE INDEX "sps_ke_source_status_idx" ON "sps_ke_source" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sps_ke_source_content_hash_idx" ON "sps_ke_source" USING btree ("content_hash");