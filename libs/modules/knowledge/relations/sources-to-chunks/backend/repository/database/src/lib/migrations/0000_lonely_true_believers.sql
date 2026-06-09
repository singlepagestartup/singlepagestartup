CREATE TABLE "sps_ke_ss_to_cs_rae" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"se_id" uuid NOT NULL,
	"ck_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ke_ss_to_cs_rae" ADD CONSTRAINT "sps_ke_ss_to_cs_rae_se_id_sps_ke_source_id_fk" FOREIGN KEY ("se_id") REFERENCES "public"."sps_ke_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ke_ss_to_cs_rae" ADD CONSTRAINT "sps_ke_ss_to_cs_rae_ck_id_sps_ke_chunk_id_fk" FOREIGN KEY ("ck_id") REFERENCES "public"."sps_ke_chunk"("id") ON DELETE cascade ON UPDATE no action;