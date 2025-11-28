CREATE TABLE "sps_nn_notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"method" text DEFAULT 'email' NOT NULL,
	"title" text,
	"data" text,
	"reciever" text NOT NULL,
	"attachments" text,
	"send_after" timestamp DEFAULT now() NOT NULL
);
