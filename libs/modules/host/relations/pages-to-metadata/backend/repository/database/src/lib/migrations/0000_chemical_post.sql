CREATE TABLE "sps_h_ps_to_ma_4m4" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"ma_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_h_ps_to_ma_4m4" ADD CONSTRAINT "sps_h_ps_to_ma_4m4_pe_id_sps_h_page_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sps_h_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_h_ps_to_ma_4m4" ADD CONSTRAINT "sps_h_ps_to_ma_4m4_ma_id_sps_h_metadata_id_fk" FOREIGN KEY ("ma_id") REFERENCES "public"."sps_h_metadata"("id") ON DELETE cascade ON UPDATE no action;