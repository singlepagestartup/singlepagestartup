export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/ecommerce/models/widget/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/ecommerce/widgets";
export const variants = [
  "default",
  "store-list-default",
  "order-list-default",
  "product-list-card-default",
  "product-overview-default",
  "category-list-default",
  "category-overview-default",
  "store-product-list-card-default",
];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
