DO $$ BEGIN
 CREATE TYPE "sps_w_b_hero_section_blocks_variant" AS ENUM('default');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sps_w_b_hero_section_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" "sps_w_b_hero_section_blocks_variant" DEFAULT 'default' NOT NULL
);