ALTER TABLE "sps_nn_ts_to_ns_v8d" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_nn_ts_to_ns_v8d" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;