CREATE TABLE "sps_h_ps_to_ls_gxd" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"lt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_h_ps_to_ls_gxd" ADD CONSTRAINT "sps_h_ps_to_ls_gxd_pe_id_sps_h_page_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sps_h_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_h_ps_to_ls_gxd" ADD CONSTRAINT "sps_h_ps_to_ls_gxd_lt_id_sps_h_layout_id_fk" FOREIGN KEY ("lt_id") REFERENCES "public"."sps_h_layout"("id") ON DELETE cascade ON UPDATE no action;