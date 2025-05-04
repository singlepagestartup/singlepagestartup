export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/blog/models/widget/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/blog/widgets";
export const variants = [
  "default",
  "article-list-card-default",
  "article-overview-default",
  "article-overview-with-private-content-default",
  "article-overview-ecommerce-module-product-list-card-default",
  "category-overview-default",
  "category-list-button-default",
  "category-list-card-default",
] as const;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
