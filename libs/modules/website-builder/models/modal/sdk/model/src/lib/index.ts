export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/website-builder/models/modal/backend/repository/database";
import {
  API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const route = "/api/website-builder/modals";
export const variants = ["default"] as const;
export const host = API_SERVICE_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
