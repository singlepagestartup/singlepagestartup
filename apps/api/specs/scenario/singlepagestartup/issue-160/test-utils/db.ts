import { count, eq } from "drizzle-orm";
import { db } from "@sps/providers-db";
import { Table as EcommerceProductTable } from "@sps/ecommerce/models/product/backend/repository/database";

export async function getProductCountFromDb() {
  const [result] = await db
    .select({
      count: count(),
    })
    .from(EcommerceProductTable);

  return Number(result?.count ?? 0);
}

export async function getProductCountByVariantFromDb(variant: string) {
  const [result] = await db
    .select({
      count: count(),
    })
    .from(EcommerceProductTable)
    .where(eq(EcommerceProductTable.variant, variant));

  return Number(result?.count ?? 0);
}
