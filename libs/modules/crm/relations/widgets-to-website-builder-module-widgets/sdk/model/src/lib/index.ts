export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/crm/relations/widgets-to-website-builder-module-widgets/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/crm/widgets-to-website-builder-module-widgets";
export const variants = ["default"] as const;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
