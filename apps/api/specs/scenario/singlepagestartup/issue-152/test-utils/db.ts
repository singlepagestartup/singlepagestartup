import { and, eq, inArray } from "drizzle-orm";
import { db } from "@sps/providers-db";
import { Table as RbacSubjectsToOrdersTable } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/repository/database";
import { Table as EcommerceOrderTable } from "@sps/ecommerce/models/order/backend/repository/database";
import { Table as EcommerceOrdersToProductsTable } from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";

export async function getCartStateFromDb({
  subjectId,
  productId,
}: {
  subjectId: string;
  productId: string;
}) {
  const subjectOrders = await db
    .select()
    .from(RbacSubjectsToOrdersTable)
    .where(eq(RbacSubjectsToOrdersTable.subjectId, subjectId));

  const orderIds = subjectOrders.map((item) => item.ecommerceModuleOrderId);

  if (orderIds.length === 0) {
    return {
      subjectOrders,
      cartOrders: [],
      ordersToProducts: [],
    };
  }

  const cartOrders = await db
    .select()
    .from(EcommerceOrderTable)
    .where(
      and(
        inArray(EcommerceOrderTable.id, orderIds),
        eq(EcommerceOrderTable.type, "cart"),
        eq(EcommerceOrderTable.status, "new"),
      ),
    );

  const cartOrderIds = cartOrders.map((item) => item.id);

  if (cartOrderIds.length === 0) {
    return {
      subjectOrders,
      cartOrders,
      ordersToProducts: [],
    };
  }

  const ordersToProducts = await db
    .select()
    .from(EcommerceOrdersToProductsTable)
    .where(
      and(
        inArray(EcommerceOrdersToProductsTable.orderId, cartOrderIds),
        eq(EcommerceOrdersToProductsTable.productId, productId),
      ),
    );

  return {
    subjectOrders,
    cartOrders,
    ordersToProducts,
  };
}
