CREATE TABLE "sps_ke_chunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"class_name" text,
	"variant" text DEFAULT 'default' NOT NULL,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	"text" text NOT NULL,
	"embedding" vector(768) NOT NULL,
	"chunk_index" integer NOT NULL,
	"token_estimate" integer DEFAULT 0 NOT NULL,
	"content_hash" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "sps_ke_chunk_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "sps_ke_chunk_embedding_hnsw_idx" ON "sps_ke_chunk" USING hnsw ("embedding" vector_cosine_ops);