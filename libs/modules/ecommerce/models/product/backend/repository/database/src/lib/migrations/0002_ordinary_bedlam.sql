ALTER TABLE "sps_ee_product" RENAME COLUMN "sku" TO "slug";--> statement-breakpoint
ALTER TABLE "sps_ee_product" DROP CONSTRAINT "sps_ee_product_sku_unique";--> statement-breakpoint
ALTER TABLE "sps_ee_product" ADD CONSTRAINT "sps_ee_product_slug_unique" UNIQUE("slug");