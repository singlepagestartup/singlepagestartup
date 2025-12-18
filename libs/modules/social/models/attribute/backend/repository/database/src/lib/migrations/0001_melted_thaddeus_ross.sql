ALTER TABLE "sl_attribute" ADD COLUMN "admin_title" text;--> statement-breakpoint
ALTER TABLE "sl_attribute" ADD COLUMN "slug" text;

-- Fill admin_title from string.en field or id if string.en is empty
UPDATE "sl_attribute"
SET "admin_title" = COALESCE(
  NULLIF(TRIM("string"->>'en'), ''),
  "id"::text
)
WHERE "admin_title" IS NULL OR TRIM("admin_title") = '';--> statement-breakpoint

-- Fill slug from id
UPDATE "sl_attribute"
SET "slug" = "id"::text
WHERE "slug" IS NULL OR TRIM("slug") = '';--> statement-breakpoint

ALTER TABLE "sl_attribute" ALTER COLUMN "admin_title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sl_attribute" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sl_attribute" ADD CONSTRAINT "sl_attribute_slug_unique" UNIQUE("slug");