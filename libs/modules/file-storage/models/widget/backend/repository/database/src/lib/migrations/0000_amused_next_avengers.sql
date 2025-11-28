CREATE TABLE "sps_f_s_widget" (
	"variant" text DEFAULT 'default',
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"title" text,
	"admin_title" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "sps_f_s_widget_slug_unique" UNIQUE("slug")
);
