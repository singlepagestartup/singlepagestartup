DO $$ BEGIN
 CREATE TYPE "sps_w_b_layouts_variant" AS ENUM('default', 'wide', 'boxed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "sps_w_b_pages_variant" AS ENUM('default');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sps_w_b_layouts" (
	"title" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" "sps_w_b_layouts_variant" DEFAULT 'default' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sps_w_b_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'Page' NOT NULL,
	"url" text DEFAULT '/' NOT NULL,
	"description" text DEFAULT 'Description',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" "sps_w_b_pages_variant" DEFAULT 'default' NOT NULL,
	CONSTRAINT "sps_w_b_pages_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sps_w_b_pages_to_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"layout_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_w_b_pages_to_layouts" ADD CONSTRAINT "sps_w_b_pages_to_layouts_page_id_sps_w_b_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "sps_w_b_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sps_w_b_pages_to_layouts" ADD CONSTRAINT "sps_w_b_pages_to_layouts_layout_id_sps_w_b_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "sps_w_b_layouts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;