import type { IModel as IOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";

export interface ICartDetails {
  lines: (IOrdersToProducts & { product: IProduct | null })[];
  totals: { total: number; billingModuleCurrency: IBillingModuleCurrency }[];
}

import type { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import type { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";

export interface IPurchaseDetails {
  totals: { total: number; billingModuleCurrency: IBillingModuleCurrency }[];
  receipts: IFileStorageModuleFile[];
}

export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/ecommerce/models/order/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/ecommerce/orders";
export const variants = ["hidden", "purchase-ai-chat", "default"];
export const types = ["cart", "history"];
export const statuses = [
  "new",
  "paying",
  "paid",
  "approving",
  "packaging",
  "delivering",
  "delivered",
  "requested_cancelation",
  "canceling",
  "canceled",
  "completed",
];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
