import type { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";

export interface IUnpricedOrderToProduct {
  ordersToProductsId: string;
  productId: string;
  reason: string;
}
export interface IOrderLineTotal {
  total: number;
  billingModuleCurrency: IBillingModuleCurrency;
}
export interface IOrderLineTotals {
  totals: IOrderLineTotal[];
  unpriced: IUnpricedOrderToProduct[];
}

export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/ecommerce/orders-to-products";
export const variants = ["default", "hidden"] as const;
/** For browser cart controls, use the API value in cartDetails.maxLineQuantity. */
export { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
