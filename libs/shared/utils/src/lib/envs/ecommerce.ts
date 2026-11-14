function orderLineMaxQuantity(): number {
  const configured = process.env["ECOMMERCE_ORDER_LINE_MAX_QUANTITY"]?.trim();
  if (!configured) {
    return 1_000_000;
  }

  const quantity = Number(configured);
  // The orders-to-products quantity column is a PostgreSQL integer.
  if (!/^\d+$/.test(configured) || quantity < 1 || quantity > 2_147_483_647) {
    throw new Error(
      "Configuration error. ECOMMERCE_ORDER_LINE_MAX_QUANTITY must be an integer from 1 to 2147483647.",
    );
  }
  return quantity;
}

export const ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS = {
  min: 1,
  max: orderLineMaxQuantity(),
} as const;
