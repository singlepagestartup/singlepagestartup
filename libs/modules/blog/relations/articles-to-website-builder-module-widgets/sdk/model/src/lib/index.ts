export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/blog/relations/articles-to-website-builder-module-widgets/backend/repository/database";
import {
  API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const route = "/api/blog/articles-to-website-builder-module-widgets";
export const variants = ["default"] as const;
export const host = API_SERVICE_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
