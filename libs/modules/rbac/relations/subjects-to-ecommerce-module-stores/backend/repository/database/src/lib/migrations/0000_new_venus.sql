CREATE TABLE "rc_ss_to_ee_me_ss_htr" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"st_id" uuid NOT NULL,
	"ee_me_se_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rc_ss_to_ee_me_ss_htr" ADD CONSTRAINT "rc_ss_to_ee_me_ss_htr_st_id_sps_rc_subject_id_fk" FOREIGN KEY ("st_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_ss_to_ee_me_ss_htr" ADD CONSTRAINT "rc_ss_to_ee_me_ss_htr_ee_me_se_id_sps_ee_store_id_fk" FOREIGN KEY ("ee_me_se_id") REFERENCES "public"."sps_ee_store"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rc_store_owner_unique" ON "rc_ss_to_ee_me_ss_htr" USING btree ("ee_me_se_id") WHERE "rc_ss_to_ee_me_ss_htr"."variant" = 'owner';