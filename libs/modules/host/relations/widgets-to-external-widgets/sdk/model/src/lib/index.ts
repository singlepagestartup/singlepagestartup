export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/host/relations/widgets-to-external-widgets/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/host/widgets-to-external-widgets";
export const variants = ["default"];
export const externalModules = [
  "agent",
  "billing",
  "blog",
  "broadcast",
  "crm",
  "ecommerce",
  "file-storage",
  "notification",
  "rbac",
  "startup",
  "website-builder",
];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
