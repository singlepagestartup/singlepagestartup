CREATE TABLE "sps_rc_ss_to_is_h58" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"st_id" uuid NOT NULL,
	"iy_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD CONSTRAINT "sps_rc_ss_to_is_h58_st_id_sps_rc_subject_id_fk" FOREIGN KEY ("st_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_is_h58" ADD CONSTRAINT "sps_rc_ss_to_is_h58_iy_id_sps_rc_identity_id_fk" FOREIGN KEY ("iy_id") REFERENCES "public"."sps_rc_identity"("id") ON DELETE cascade ON UPDATE no action;