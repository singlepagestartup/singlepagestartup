ALTER TABLE "sps_rc_ss_to_ss_1eh" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_rc_ss_to_ss_1eh" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;