ALTER TABLE "sps_ee_os_to_ps_d4c" ADD COLUMN "offer_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_ps_d4c" ADD COLUMN "parent_line_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_ps_d4c" ADD COLUMN "destination" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_ps_d4c" ADD COLUMN "recurrence" text DEFAULT 'each' NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_ps_d4c" ADD COLUMN "selection_updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_ps_d4c" ADD COLUMN "quote_version" text;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_ps_d4c" ADD COLUMN "quote_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_ps_d4c" ADD CONSTRAINT "sps_ee_os_to_ps_d4c_offer_id_sps_ee_ss_to_ps_vn7_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."sps_ee_ss_to_ps_vn7"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_ps_d4c" ADD CONSTRAINT "sps_ee_os_to_ps_d4c_parent_line_id_sps_ee_os_to_ps_d4c_id_fk" FOREIGN KEY ("parent_line_id") REFERENCES "public"."sps_ee_os_to_ps_d4c"("id") ON DELETE cascade ON UPDATE no action;