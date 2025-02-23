export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/repository/database";
import {
  API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const route = "/api/ecommerce/attribute-keys-to-attributes";
export const variants = ["default"] as const;
export const host = API_SERVICE_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
