ALTER TABLE "sps_blog_cs_to_as_d3r" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_blog_cs_to_as_d3r" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;